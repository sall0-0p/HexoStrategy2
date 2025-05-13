import {Players, ReplicatedStorage, RunService} from "@rbxts/services";
import {Nation} from "./Nation";
import {nationRepository} from "./NationRepository";
import {eventBus} from "../EventBus";
import {NationDTO} from "../../../shared/networking/dto/NationDTO";

const replicator = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("NationReplicator") as RemoteEvent;

export class NationReplicator {
    private dirtyNations = new Set<Nation>;

    private static instance: NationReplicator;
    private constructor() {
        this.broadcastNationsToEveryone();

        eventBus.subscribe<Nation>("nationDirty", (nation) => {
            this.markDirty(nation);
        })

        Players.PlayerAdded.Connect((player) => {
            this.sendNationsToPlayer(player);
        })

        RunService.Heartbeat.Connect(() => {
            this.broadcastUpdates();
        })
    }

    // public methods

    public markDirty(nation: Nation) {
        this.dirtyNations.add(nation);
    }

    // private methods

    private sendNationsToPlayer(player: Player) {
        const payload: NationDTO[] = nationRepository.getAll()
            .map((nation) => {
                return nation.toDTO();
            })

        replicator.FireClient(player, {
            type: "full",
            payload: payload,
        });
    }

    private broadcastNationsToEveryone() {
        const payload: NationDTO[] = nationRepository.getAll()
            .map((nation) => {
                return nation.toDTO();
            })

        replicator.FireAllClients({
            type: "full",
            payload: payload,
        });
    }

    private broadcastUpdates() {
        if (this.dirtyNations.size() > 0) {
            const payload: NationDTO[] = [];

            this.dirtyNations.forEach((nation) => {
                payload.push(nation.toDTO());
            })

            replicator.FireAllClients({
                type: "update",
                payload: payload,
            });
            this.dirtyNations.clear();
        }

    }

    // singleton
    public static getInstance() {
        if (!this.instance) {
            this.instance = new NationReplicator();
        }

        return this.instance;
    }
}

export const nationReplicator = NationReplicator.getInstance();