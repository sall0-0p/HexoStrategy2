import {EquipmentArchetype} from "../../../shared/constants/EquipmentArchetype";
import {EquipmentType} from "./type/EquipmentType";

export class EquipmentStockpile {
    private readonly stockpile: Map<EquipmentArchetype, Map<EquipmentType, number>> = new Map();
    public changed: boolean = false;

    constructor() {

    }

    private getForArchetype(archetype: EquipmentArchetype) {
        const candidate = this.stockpile.get(archetype);
        if (candidate) return candidate;

        const newMap: Map<EquipmentType, number> = new Map();
        this.stockpile.set(archetype, newMap);
        return newMap;
    }

    public addEquipment(equipmentType: EquipmentType, count: number) {
        assert(count >= 0, "Added equipment count has to be positive");
        const aStockpile = this.getForArchetype(equipmentType.getArchetype());
        const curCount = this.getEquipmentCount(equipmentType);
        aStockpile.set(equipmentType, curCount + count);
        this.changed = true;
    }

    public removeEquipment(equipmentType: EquipmentType, count: number) {
        assert(count <= 0, "Removed equipment count has to be negative");
        const aStockpile = this.getForArchetype(equipmentType.getArchetype());
        const curCount = this.getEquipmentCount(equipmentType);
        aStockpile.set(equipmentType, math.max(curCount - count, 0));
        this.changed = true;
    }

    public setEquipment(equipmentType: EquipmentType, count: number) {
        assert(count >= 0, "Equipment count has to be positive");
        const aStockpile = this.getForArchetype(equipmentType.getArchetype());
        aStockpile.set(equipmentType, count);
        this.changed = true;
    }

    public takeEquipmentForArchetype(archetype: EquipmentArchetype, count: number, sort?: (a: EquipmentType, b: EquipmentType) => boolean): Map<EquipmentType, number> {
        const stockpileMap = this.stockpile.get(archetype);
        const result: Map<EquipmentType, number> = new Map();
        let remaining = count;

        if (!stockpileMap) return result;
        const stockpile: [EquipmentType, number][] = [];
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
                remaining -= toTake;
            }
        }

        return result;
    }

    public multiplyAllBy(value: number) {
        this.stockpile.forEach((s) => {
            s.forEach((n, t) => {
                s.set(t, math.round(n * value));
            })
        });
        this.changed = true;
    }

    public getEquipmentCount(equipmentType: EquipmentType): number {
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
}