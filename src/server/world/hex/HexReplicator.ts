import {ReplicatedStorage, RunService} from "@rbxts/services";
import {HexDTO} from "../../../shared/network/hex/DTO";
import {HexRepository} from "./HexRepository";
import {HexCreateMessage, HexUpdateMessage} from "../../../shared/network/hex/Replicator";
import {DirtyHexEvent, dirtyHexSignal} from "./DirtyHexSignal";
import {Hex} from "./Hex";

const replicator = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("HexReplicator") as RemoteEvent;
const stateRequestRemote = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("StateRequests")
    .WaitForChild("GetHexState") as RemoteFunction;

export class HexReplicator {
    private dirtyHexes = new Map<string, Partial<HexDTO>>;

    private static instance: HexReplicator;
    private constructor(private hexRepository: HexRepository) {
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

    public markAsDirty(hex: Hex, delta: Partial<HexDTO>) {
        const hexId = hex.getId();
        if (!this.dirtyHexes.has(hexId)) {
            this.dirtyHexes.set(hexId, delta);
        } else {
            const hexDelta = this.dirtyHexes.get(hexId)
            this.dirtyHexes.set(hexId, {
                ...hexDelta,
                ...delta,
            })
        }
    }

    // private methods'

    /** @deprecated Use markAsDirtyInstead **/
    private parseDirtyHexEvent(event: DirtyHexEvent) {
        this.markAsDirty(event.hex, event.delta);
    }

    private sendHexesToPlayer(player: Player) {
        const payload: HexDTO[] = this.hexRepository.getAll()
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
    public static getInstance(hexRepository?: HexRepository) {
        if (!this.instance && hexRepository) {
            this.instance = new HexReplicator(hexRepository);
        }

        return this.instance;
    }
}