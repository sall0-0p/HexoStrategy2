import {Players, ReplicatedStorage, RunService} from "@rbxts/services";
import {NationRepository} from "./NationRepository";
import {NationDTO} from "../../../shared/network/nation/DTO";
import {DirtyNationEvent, dirtyNationSignal} from "./DirtyNationSignal";
import {HexUpdateMessage} from "../../../shared/network/hex/Replicator";

const replicator = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("NationReplicator") as RemoteEvent;
const stateRequestRemote = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("StateRequests")
    .WaitForChild("GetNationState") as RemoteFunction;

const nationRepository = NationRepository.getInstance();
export class NationReplicator {
    private dirtyNations = new Map<string, Partial<NationDTO>>;

    private static instance: NationReplicator;
    private constructor() {
        dirtyNationSignal.connect((event) => {
            this.parseDirtyNationEvent(event);
        })

        RunService.Heartbeat.Connect(() => {
            this.broadcastUpdates();
        })

        stateRequestRemote.OnServerInvoke = (player) => {
            return this.sendNationsToPlayer(player);
        }
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

        return {
            source: "playerAdded",
            type: "create",
            payload: payload,
        };
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