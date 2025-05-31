import {Players, ReplicatedStorage, RunService} from "@rbxts/services";
import {HexDTO} from "../../../shared/dto/HexDTO";
import {HexRepository} from "./HexRepository";
import {HexCreateMessage, HexUpdateMessage} from "../../../shared/dto/HexReplicatorMessage";
import {DirtyHexEvent, dirtyHexSignal} from "./DirtyHexSignal";

const replicator = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("HexReplicator") as RemoteEvent;
const stateRequestRemote = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("StateRequests")
    .WaitForChild("GetHexState") as RemoteFunction;

const hexRepository = HexRepository.getInstance();
export class HexReplicator {
    private dirtyHexes = new Map<string, Partial<HexDTO>>;

    private static instance: HexReplicator;
    private constructor() {
        dirtyHexSignal.connect((event) => {
            this.parseDirtyHexEvent(event);
        })

        RunService.Heartbeat.Connect(() => {
            this.broadcastUpdates();
        })

        stateRequestRemote.OnServerInvoke = (player) => {
            return this.sendHexesToPlayer(player);
        }
    }

    // private methods
    private parseDirtyHexEvent(event: DirtyHexEvent) {
        const hex = event.hex;

        // if hex was clean
        const hexId = hex.getId();
        if (!this.dirtyHexes.has(hexId)) {
            this.dirtyHexes.set(hexId, event.delta);
        } else {
            const hexDelta = this.dirtyHexes.get(hexId)
            this.dirtyHexes.set(hexId, {
                ...hexDelta,
                ...event.delta,
            })
        }
    }

    private sendHexesToPlayer(player: Player) {
        const payload: HexDTO[] = hexRepository.getAll()
            .map((hex) => {
                return hex.toDTO();
            })

        return {
            source: "playerAdded",
            type: "create",
            payload: payload,
        } as HexCreateMessage
    }

    private broadcastUpdates() {
        if (this.dirtyHexes.size() === 0) return;

        replicator.FireAllClients({
            type: "update",
            payload: this.dirtyHexes,
        } as HexUpdateMessage)

        this.dirtyHexes.clear();
    }

    // singleton
    public static getInstance() {
        if (!this.instance) {
            this.instance = new HexReplicator();
        }

        return this.instance;
    }
}