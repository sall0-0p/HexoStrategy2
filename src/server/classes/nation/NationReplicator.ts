import {Players, ReplicatedStorage, RunService} from "@rbxts/services";
import {nationRepository} from "./NationRepository";
import {NationDTO} from "../../../shared/dto/NationDTO";
import {DirtyNationEvent, dirtyNationSignal} from "./DirtyNationSignal";
import {HexUpdateMessage} from "../../../shared/dto/HexReplicatorMessage";

const replicator = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("NationReplicator") as RemoteEvent;

export class NationReplicator {
    private dirtyNations = new Map<string, Partial<NationDTO>>;

    private static instance: NationReplicator;
    private constructor() {
        this.broadcastNationsToEveryone();

        dirtyNationSignal.connect((event) => {
            this.parseDirtyNationEvent(event);
        })

        Players.PlayerAdded.Connect((player) => {
            this.sendNationsToPlayer(player);
        })

        RunService.Heartbeat.Connect(() => {
            this.broadcastUpdates();
        })
    }

    // private methods

    private parseDirtyNationEvent(event: DirtyNationEvent) {
        const nation = event.nation;

        const nationId = nation.getId();
        if (!this.dirtyNations.has(nationId)) {
            this.dirtyNations.set(nationId, event.delta);
        } else {
            const nationDelta = this.dirtyNations.get(nationId)
            this.dirtyNations.set(nationId, {
                ...nationDelta,
                ...event.delta,
            })
        }
    }

    private sendNationsToPlayer(player: Player) {
        const payload: NationDTO[] = nationRepository.getAll()
            .map((nation) => {
                return nation.toDTO();
            })

        replicator.FireClient(player, {
            source: "playerAdded",
            type: "create",
            payload: payload,
        });
    }

    private broadcastNationsToEveryone() {
        const payload: NationDTO[] = nationRepository.getAll()
            .map((nation) => {
                return nation.toDTO();
            })

        replicator.FireAllClients({
            source: "start",
            type: "create",
            payload: payload,
        });
    }

    private broadcastUpdates() {
        if (this.dirtyNations.size() === 0) return;

        replicator.FireAllClients({
            type: "update",
            payload: this.dirtyNations,
        } as HexUpdateMessage)

        this.dirtyNations.clear();
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