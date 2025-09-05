import {EquipmentArchetype} from "../../../../shared/constants/EquipmentArchetype";
import {BaseEquipmentType} from "../type/BaseEquipmentType";
import {EquipmentStockpileReplicator} from "./EquipmentStockpileReplicator";
import {Nation} from "../../../world/nation/Nation";
import {Unit} from "../../unit/Unit";

export class EquipmentStockpile {
    private readonly stockpile: Map<EquipmentArchetype, Map<BaseEquipmentType, number>> = new Map();
    private replicator: EquipmentStockpileReplicator;
    public changed: boolean = false;

    constructor(public readonly kind: "Unit" | "Nation", public readonly target: Unit | Nation) {
        print(kind, target.getId(), target.getName(), Counter.getNext());
        this.replicator = new EquipmentStockpileReplicator(this);
    }

    private getForArchetype(archetype: EquipmentArchetype) {
        const candidate = this.stockpile.get(archetype);
        if (candidate) return candidate;

        const newMap: Map<BaseEquipmentType, number> = new Map();
        this.stockpile.set(archetype, newMap);
        return newMap;
    }

    public getAll() {
        const result: Map<BaseEquipmentType, number> = new Map();
        this.stockpile.forEach((m, a) => {
            m.forEach((n, t) => {
                result.set(t, n);
            })
        })
        return result;
    }

    public addEquipment(equipmentType: BaseEquipmentType, count: number) {
        assert(count >= 0, "Added equipment count has to be positive");
        const aStockpile = this.getForArchetype(equipmentType.getArchetype());
        const curCount = this.getEquipmentCount(equipmentType);
        aStockpile.set(equipmentType, curCount + count);
        this.changed = true;
        this.replicator.sendDelta([equipmentType]);
    }

    public removeEquipment(equipmentType: BaseEquipmentType, count: number) {
        assert(count >= 0, "Removed equipment count has to be positive");
        const aStockpile = this.getForArchetype(equipmentType.getArchetype());
        const curCount = this.getEquipmentCount(equipmentType);
        aStockpile.set(equipmentType, math.max(curCount - count, 0));
        this.changed = true;
        this.replicator.sendDelta([equipmentType]);
    }

    public setEquipment(equipmentType: BaseEquipmentType, count: number) {
        assert(count >= 0, "Equipment count has to be positive");
        const aStockpile = this.getForArchetype(equipmentType.getArchetype());
        aStockpile.set(equipmentType, count);
        this.changed = true;
        this.replicator.sendDelta([equipmentType]);
    }

    public takeEquipmentForArchetype(archetype: EquipmentArchetype, count: number, sort?: (a: BaseEquipmentType, b: BaseEquipmentType) => boolean): Map<BaseEquipmentType, number> {
        const stockpileMap = this.stockpile.get(archetype);
        const result: Map<BaseEquipmentType, number> = new Map();
        const types: BaseEquipmentType[] = [];
        let remaining = count;

        if (!stockpileMap) return result;
        const stockpile: [BaseEquipmentType, number][] = [];
        stockpileMap.forEach((n, t) => {
            stockpile.push([t, n]);
        })

        stockpile.sort((a, b) => {
            if (sort) {
                return sort(a[0], b[0]);
            } else {
                return a[0].getGeneration() > b[0].getGeneration();
            }
        })

        for (const [t, n] of stockpile) {
            if (remaining <= 0) break;

            const toTake = math.min(n, remaining);
            if (toTake > 0 && stockpileMap.get(t)) {
                result.set(t, toTake);
                stockpileMap.set(t, stockpileMap.get(t)! - toTake);
                types.push(t);
                remaining -= toTake;
            }
        }

        this.replicator.sendDelta(types);
        return result;
    }

    public multiplyAllBy(value: number) {
        this.stockpile.forEach((s) => {
            s.forEach((n, t) => {
                s.set(t, math.round(n * value));
            })
        });
        this.changed = true;

        const types: BaseEquipmentType[] = [];
        this.getAll().forEach((n, t) => {
            types.push(t);
        })
        this.replicator.sendDelta(types);
    }

    public getEquipmentCount(equipmentType: BaseEquipmentType): number {
        const aStockpile = this.getForArchetype(equipmentType.getArchetype());
        return aStockpile.get(equipmentType) ?? 0;
    }

    public getEquipmentCountForArchetype(archetype: EquipmentArchetype): number {
        const aStockpile = this.getForArchetype(archetype);
        let sum = 0;
        aStockpile.forEach((n, t) => {
            sum += n;
        });
        return sum;
    }

    public getStockpile() {
        return this.stockpile as ReadonlyMap<EquipmentArchetype, ReadonlyMap<BaseEquipmentType, number>>;
    }

    public cleanup() {
        this.replicator.cleanup();
    }
}

namespace Counter {
    let count = 1;

    export function getNext() {
        return count++;
    }
}