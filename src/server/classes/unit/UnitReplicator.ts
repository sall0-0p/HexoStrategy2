import {UnitDTO} from "../../../shared/dto/UnitDTO";
import {Unit} from "./Unit";
import {ReplicatedStorage, RunService} from "@rbxts/services";
import {UnitCreateMessage, UnitDeleteMessage, UnitUpdateMessage} from "../../../shared/dto/UnitReplicatorMessage";

const replicator = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("UnitReplicator") as RemoteEvent;

export class UnitReplicator {
    private createdUnits: UnitDTO[] = [];
    private dirtyUnits = new Map<number, Partial<UnitDTO>>;
    private deadUnits: Unit[] = [];
    private deletedUnits: Unit[] = [];

    private static instance: UnitReplicator;
    private constructor() {
        RunService.Heartbeat.Connect(() => {
            this.broadcastCreations();
            this.broadcastUpdates();
            this.broadcastDeaths();
            this.broadcastDeletions()
        })
    }

    // broadcasts

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
        this.deletedUnits.clear();
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

    public static getInstance() {
        if (!this.instance) {
            this.instance = new UnitReplicator();
        }

        return this.instance;
    }
}