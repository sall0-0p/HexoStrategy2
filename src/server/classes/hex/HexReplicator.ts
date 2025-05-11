import {Players, ReplicatedStorage, RunService} from "@rbxts/services";
import {Hex} from "./Hex";
import {HexDTO} from "../../../shared/networking/dto/HexDTO";
import {hexRepository} from "./HexRepository";
import {eventBus} from "../EventBus";

const replicator = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("HexReplicator") as RemoteEvent;

export class HexReplicator {
    private dirtyHexes = new Set<Hex>;

    private static instance: HexReplicator;
    private constructor() {
        this.broadcastHexesToEveryone();

        eventBus.subscribe<Hex>("hexDirty", (hex) => {
            this.markDirty(hex);
        })

        Players.PlayerAdded.Connect((player) => {
            this.sendHexesToPlayer(player);
        })

        RunService.Heartbeat.Connect(() => {
            this.broadcastUpdates();
        })
    }

    // public methods

    public markDirty(hex: Hex) {
        this.dirtyHexes.add(hex);
    }

    // private methods

    private sendHexesToPlayer(player: Player) {
        const payload: HexDTO[] = hexRepository.getAll()
            .map((hex) => {
                return hex.toDTO();
            })

        replicator.FireClient(player, {
            type: "full",
            payload: payload,
        });
    }

    private broadcastHexesToEveryone() {
        const payload: HexDTO[] = hexRepository.getAll()
            .map((hex) => {
                return hex.toDTO();
            })

        replicator.FireAllClients({
            type: "full",
            payload: payload,
        });
    }

    private broadcastUpdates() {
        if (this.dirtyHexes.size() > 0) {
            const payload: HexDTO[] = [];

            this.dirtyHexes.forEach((hex) => {
                payload.push(hex.toDTO());
            })

            replicator.FireAllClients({
                type: "update",
                payload: payload,
            });
            this.dirtyHexes.clear();
        }

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