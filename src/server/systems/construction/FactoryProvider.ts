import {Nation} from "../../world/nation/Nation";
import {FactoryReservationType, FactorySourceType} from "../../../shared/constants/FactoryDef";
import {Signal} from "../../../shared/classes/Signal";
import {Building} from "../../../shared/data/ts/BuildingDefs";
import {MessageData, MessageType} from "../../../shared/network/tether/messages/FactoryProvider";
import {ReplicatedStorage} from "@rbxts/services";

const replicator = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("FactoryProviderReplicator") as RemoteEvent;

export class FactoryProvider {
    private staticSources: Map<FactorySourceType, number> = new Map();
    private reservations: Map<FactoryReservationType, number> = new Map();
    private constructionsUsed: number = 0;

    public readonly updated: Signal<[]> = new Signal();

    constructor(private readonly nation: Nation) {
        const buildings = nation.getBuildings();
        buildings.updated.connect(() =>
            this.setSource(FactorySourceType.Building, buildings.get(Building.CivilianFactory)));
    }

    public setSource(src: FactorySourceType, count: number) {
        const c = math.max(0, count);
        const prev = this.staticSources.get(src) ?? 0;
        if (prev === c) return;
        if (c === 0) this.staticSources.delete(src);
        else this.staticSources.set(src, c);
        this.updated.fire();
        this.replicate();
    };

    public addToSource(src: FactorySourceType, count: number) {
        const cur = this.staticSources.get(src) ?? 0;
        this.setSource(src, cur + count);
    }

    public removeSource(src: FactorySourceType) {
        if (this.staticSources.delete(src)) {
            this.updated.fire();
            this.replicate();
        }
    }

    public setReservation(res: FactoryReservationType, count: number) {
        const c = math.max(0, count);
        const prev = this.reservations.get(res) ?? 0;
        if (prev === c) return;
        if (c === 0) this.reservations.delete(res);
        else this.reservations.set(res, c);
        this.updated.fire();
        this.replicate();
    }

    public addReservation(res: FactoryReservationType, count: number) {
        const cur = this.reservations.get(res) ?? 0;
        this.setReservation(res, cur + count);
    }

    public clearReservation(res: FactoryReservationType) {
        if (this.reservations.delete(res)) {
            this.updated.fire();
            this.replicate();
        }
    }

    public updateUsedConstructions(count: number) {
        const c = math.max(0, count);
        if (this.constructionsUsed === c) return;
        this.constructionsUsed = c;
        this.updated.fire();
        this.replicateUsed();
    }

    public getTotal() {
        let sum = 0;
        this.staticSources.forEach((v) => {
            sum += v;
        })
        return sum;
    }

    public getReserved() {
        let sum = 0;
        this.reservations.forEach((v) => {
            sum += v;
        })
        return sum;
    }

    public getAvailable() {
        return math.max(0, this.getTotal() - this.getReserved());
    }

    public getUsedInConstructions() {
        return this.constructionsUsed;
    }

    public getUnallocated() {
        return math.max(0, this.getAvailable() - this.constructionsUsed);
    }

    private replicateUsed() {
        const data = {
            type: "used",
            nationId: this.nation.getId(),
            total: this.getTotal(),
            used: this.getUsedInConstructions(),
        } as MessageData[MessageType.ReplicateUsed];

        replicator.FireAllClients(data);
    }

    private replicate() {
        const data = {
            type: "full",
            nationId: this.nation.getId(),
            total: this.getTotal(),
            reserved: this.getReserved(),
            used: this.getUsedInConstructions(),
            available: this.getAvailable(),
            unallocated: this.getUnallocated(),
            sources: this.staticSources,
            reservations: this.reservations,
        } as MessageData[MessageType.ReplicateFull];

        replicator.FireAllClients(data);
    }
}