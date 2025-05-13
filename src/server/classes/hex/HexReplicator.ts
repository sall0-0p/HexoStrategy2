import {Players, ReplicatedStorage, RunService} from "@rbxts/services";
import {HexDTO} from "../../../shared/dto/HexDTO";
import {hexRepository} from "./HexRepository";
import {HexCreateMessage, HexUpdateMessage} from "../../../shared/dto/HexReplicatorMessage";
import {DirtyHexEvent, dirtyHexSignal} from "./dirtyHexSignal";

const replicator = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("HexReplicator") as RemoteEvent;

export class HexReplicator {
    private dirtyProperties = new Map<string, Partial<HexDTO>>;

    private static instance: HexReplicator;
    private constructor() {
        this.broadcastHexesToEveryone();

        dirtyHexSignal.connect((event) => {
            this.parseDirtyHexEvent(event);
        })

        Players.PlayerAdded.Connect((player) => {
            this.sendHexesToPlayer(player);
        })

        RunService.Heartbeat.Connect(() => {
            this.broadcastUpdates();
        })
    }

    // private methods
    private parseDirtyHexEvent(event: DirtyHexEvent) {
        const hex = event.hex;

        // if hex was clean
        const hexId = hex.getId();
        if (!this.dirtyProperties.has(hexId)) {
            this.dirtyProperties.set(hexId, event.delta);
        } else {
            const hexDelta = this.dirtyProperties.get(hexId)
            this.dirtyProperties.set(hexId, {
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

        replicator.FireClient(player, {
            source: "playerAdded",
            type: "create",
            payload: payload,
        } as HexCreateMessage);
    }

    private broadcastHexesToEveryone() {
        const payload: HexDTO[] = hexRepository.getAll()
            .map((hex) => {
                return hex.toDTO();
            })

        replicator.FireAllClients({
            source: "start",
            type: "create",
            payload: payload,
        } as HexCreateMessage);
    }

    private broadcastUpdates() {
        if (this.dirtyProperties.size() === 0) return;

        replicator.FireAllClients({
            type: "update",
            payload: this.dirtyProperties,
        } as HexUpdateMessage)

        this.dirtyProperties.clear();
    }

    // singleton
    public static getInstance() {
        if (!this.instance) {
            this.instance = new HexReplicator();
        }

        return this.instance;
    }
}

export const hexReplicator = HexReplicator.getInstance();