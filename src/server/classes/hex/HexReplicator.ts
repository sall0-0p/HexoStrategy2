import {Players, ReplicatedStorage, RunService} from "@rbxts/services";
import {HexDTO} from "../../../shared/dto/HexDTO";
import {hexRepository} from "./HexRepository";
import {HexCreateMessage, HexUpdateMessage} from "../../../shared/dto/HexReplicatorMessage";
import {DirtyHexEvent, dirtyHexSignal} from "./DirtyHexSignal";

const replicator = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("HexReplicator") as RemoteEvent;

export class HexReplicator {
    private dirtyHexes = new Map<string, Partial<HexDTO>>;

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

export const hexReplicator = HexReplicator.getInstance();