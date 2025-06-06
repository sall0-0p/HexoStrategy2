import {UnitDTO} from "../../../shared/dto/UnitDTO";
import {Unit} from "./Unit";
import {ReplicatedStorage, RunService} from "@rbxts/services";
import {UnitCreateMessage, UnitDeleteMessage, UnitUpdateMessage} from "../../../shared/dto/UnitReplicatorMessage";
import {UnitRepository} from "./UnitRepository";

const replicator = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("UnitReplicator") as RemoteEvent;
const stateRequestRemote = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("StateRequests")
    .WaitForChild("GetUnitState") as RemoteFunction;

export class UnitReplicator {
    private createdUnits: UnitDTO[] = [];
    private dirtyUnits = new Map<string, Partial<UnitDTO>>;
    private deadUnits: Unit[] = [];
    private deletedUnits: Unit[] = [];

    private unitRepository;
    private static instance: UnitReplicator;
    private constructor(unitRepository: UnitRepository) {
        this.unitRepository = unitRepository;
        stateRequestRemote.OnServerInvoke = (player) => {
            return this.broadcastAllToPlayer(player);
        }

        RunService.Heartbeat.Connect(() => {
            this.broadcastCreations();
            this.broadcastUpdates();
            this.broadcastDeaths();
            this.broadcastDeletions()
        })
    }

    // broadcasts
    private broadcastAllToPlayer(player: Player) {
        const currentUnits = this.unitRepository.getAll();
        if (currentUnits.size() === 0) return;
        const payload: UnitDTO[] = currentUnits.map((unit) => unit.toDTO());

        return {
            source: "playerAdded",
            type: "create",
            payload: payload,
        } as UnitCreateMessage;
    }

    private broadcastCreations() {
        if (this.createdUnits.size() === 0) return;

        replicator.FireAllClients({
            source: "new",
            type: "create",
            payload: this.createdUnits,
        } as UnitCreateMessage);
        this.createdUnits.clear();
    }

    private broadcastUpdates() {
        if (this.dirtyUnits.size() === 0) return;

        replicator.FireAllClients({
            type: "update",
            payload: this.dirtyUnits,
        } as UnitUpdateMessage);
        this.dirtyUnits.clear();
    }

    private broadcastDeaths() {
        if (this.deadUnits.size() === 0) return;

        replicator.FireAllClients({
            type: "delete",
            payload: this.deadUnits.map((unit) => {
                return unit.getId();
            }),
            died: true,
        } as UnitDeleteMessage);
        this.deadUnits.clear();
    }

    private broadcastDeletions() {
        if (this.deletedUnits.size() === 0) return;

        replicator.FireAllClients({
            type: "delete",
            payload: this.deadUnits.map((unit) => {
                return unit.getId();
            }),
            died: false,
        } as UnitDeleteMessage);
        this.deletedUnits.clear();
    }

    // marking logic

    public markDirty(unit: Unit, delta: Partial<UnitDTO>) {
        if (!this.dirtyUnits.has(unit.getId())) {
            this.dirtyUnits.set(unit.getId(), delta);
        } else {
            const unitDelta = this.dirtyUnits.get(unit.getId());
            this.dirtyUnits.set(unit.getId(), {
                ...unitDelta,
                ...delta,
            })
        }
    }

    public addToCreateQueue(unit: Unit) {
        this.createdUnits.push(unit.toDTO());
    }

    public addToDeadQueue(unit: Unit) {
        this.deadUnits.push(unit);
    }

    public addToDeletionQueue(unit: Unit) {
        this.deletedUnits.push(unit);
    }

    public static getInstance(unitRepository?: UnitRepository): UnitReplicator {
        if (!this.instance && unitRepository) {
            this.instance = new UnitReplicator(unitRepository);
        }

        return this.instance;
    }
}