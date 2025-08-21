import {BuildingType} from "../../../shared/classes/BuildingDef";
import {Hex} from "../hex/Hex";
import {Region} from "../region/Region";
import {ModifiableProperty} from "../../../shared/classes/ModifiableProperty";
import {Nation} from "../nation/Nation";
import {Building, BuildingDefs} from "../../../shared/data/ts/BuildingDefs";
import {BuildingComponentDTO} from "../../../shared/network/building/BuildingComponentDTO";
import {Signal} from "../../../shared/classes/Signal";

export abstract class BuildingComponent {
    protected buildings = new Map<Building, number>();
    public updated = new Signal<[]>(); // fires when this component changes

    public getBuildingCount(building: Building): number {
        return this.buildings.get(building) ?? 0;
    }

    public updateOwner(prevOwner?: Nation, nextOwner?: Nation): void {
        if (this.buildings.size() === 0) return;

        if (prevOwner) {
            const prevAgg = prevOwner.getBuildings();
            if (prevAgg) {
                for (const [b, count] of this.buildings) {
                    if (count > 0) prevAgg.addDelta(b, -count);
                }
            }
        }

        if (nextOwner) {
            const nextAgg = nextOwner.getBuildings();
            if (nextAgg) {
                for (const [b, count] of this.buildings) {
                    if (count > 0) nextAgg.addDelta(b, tonumber(count)!);
                }
            }
        }
    }
}

export class HexBuildingComponent extends BuildingComponent {
    private hex: Hex;
    constructor(hex: Hex) {
        super();
        this.hex = hex;
    }

    public getSlotCount(building: Building) {
        return BuildingDefs[building].maxLevel;
    }

    private addToNation(building: Building, delta: number) {
        if (delta === 0) return;
        const owner = this.hex.getOwner();
        if (!owner) return;
        const agg = owner.getBuildings();
        if (!agg) return;
        agg.addDelta(building, delta);
    }

    public addBuilding(building: Building, qty = 1) {
        const def = BuildingDefs[building];
        if (def.type !== "hex") error(`Attempting to add building designated for ${def.type} to Hex building component!`);

        const nextt = (this.buildings.get(building) ?? 0) + qty;
        if (nextt > this.getSlotCount(building)) return;

        this.buildings.set(building, nextt);
        this.addToNation(building, qty);
        this.updated.fire();
    }

    public removeBuilding(building: Building, qty = 1): void {
        const cur = this.buildings.get(building) ?? 0;
        const nextt = math.clamp(cur - qty, 0, math.huge);
        const delta = nextt - cur; // <= 0
        if (delta === 0) return;

        this.buildings.set(building, nextt);
        this.addToNation(building, delta);
        this.updated.fire();
    }

    public setBuilding(building: Building, qty: number) {
        const def = BuildingDefs[building];
        if (def.type !== "hex") error(`Attempting to set building designated for ${def.type} to Hex building component!`);

        if (qty > this.getSlotCount(building)) return;
        const old = this.buildings.get(building) ?? 0;
        if (qty === old) return;

        this.buildings.set(building, qty);
        this.addToNation(building, qty - old);
        this.updated.fire();
    }

    public toDTO(): BuildingComponentDTO {
        const cm = this.hex.getRegion().getOwner().getConstructionManager();

        const slots = new Map<Building, number>();
        for (const [id, building] of pairs(Building)) {
            const def = BuildingDefs[building];
            if (def.type === BuildingType.Hex) {
                slots.set(building, this.getSlotCount(building));
            }
        }

        const ongoing = cm.getConstructionsIn(this.hex);
        const planned = new Map<Building, number>();
        ongoing.forEach((project) => {
            planned.set(project.type, (planned.get(project.type) ?? 0) + 1);
        });

        return { type: "hex", built: this.buildings, planned, slots };
    }
}

/** ---------- Region (with shared slots) ---------- */

export class RegionBuildingComponent extends BuildingComponent {
    private region: Region;

    constructor(region: Region) {
        super();
        this.region = region;
    }

    /** Pool-wide extra shared slots granted by effects/tech/etc. */
    private additionalSharedSlots = 0;

    /** Total shared pool capacity for this region (base → modified → floored) + bonuses */
    private getSharedPool(): number {
        const base = this.region.getCategory().sharedSlots;
        const modified = this.region.getModifiers().getEffectiveValue(base, [ModifiableProperty.MaxSharedSlotsInRegion]);
        const floored = math.floor(modified);
        return math.max(0, floored + this.additionalSharedSlots);
    }

    /** Sum of already placed shared buildings in this region */
    private getSharedUsed(exceptBuilding?: Building): number {
        let used = 0;
        for (const [b, count] of this.buildings) {
            const def = BuildingDefs[b];
            if (def.type === "shared") {
                if (exceptBuilding !== undefined && b === exceptBuilding) continue;
                used += count;
            }
        }
        return used;
    }

    public getSlotCount(building: Building) {
        const def = BuildingDefs[building];
        if (def.type === "region") {
            return def.maxLevel;
        }

        const pool = this.getSharedPool();
        const curThis = this.getBuildingCount(building);
        const usedOthers = this.getSharedUsed(building);
        const remainingPool = math.max(0, pool - usedOthers); // how much this building can still occupy considering others
        return math.min(def.maxLevel, remainingPool + curThis);
    }

    private addToNation(building: Building, delta: number) {
        if (delta === 0) return;
        const owner = this.region.getOwner();
        if (!owner) return;
        const agg = owner.getBuildings();
        if (!agg) return;
        agg.addDelta(building, delta);
    }

    public addBuilding(building: Building, qty = 1) {
        const def = BuildingDefs[building];
        if (def.type === "hex") error(`Attempting to add building designated for hex to Region building component!`);

        const cur = this.buildings.get(building) ?? 0;
        const nextt = cur + qty;

        if (nextt > def.maxLevel) return;

        if (def.type === "shared") {
            const pool = this.getSharedPool();
            const used = this.getSharedUsed() + qty;
            if (used > pool) return;
        }

        this.buildings.set(building, nextt);
        this.addToNation(building, qty);
        this.updated.fire();
    }

    public removeBuilding(building: Building, qty = 1): void {
        const cur = this.buildings.get(building) ?? 0;
        const nextt = math.clamp(cur - qty, 0, math.huge);
        const delta = nextt - cur; // <= 0
        if (delta === 0) return;

        this.buildings.set(building, nextt);
        this.addToNation(building, delta);
        this.updated.fire();
    }

    public setBuilding(building: Building, qty: number) {
        const def = BuildingDefs[building];
        if (def.type === "hex") error(`Attempting to set building designated for hex to Region building component!`);

        if (qty > def.maxLevel) return;

        const old = this.buildings.get(building) ?? 0;

        if (def.type === "shared") {
            // When setting, ensure total (others + qty) <= pool
            const pool = this.getSharedPool();
            const usedOthers = this.getSharedUsed(building);
            if (usedOthers + qty > pool) return;
        }

        if (qty === old) return;

        this.buildings.set(building, qty);
        this.addToNation(building, qty - old);
        this.updated.fire();
    }

    public addAdditionalSlot(qty = 1) {
        if (qty <= 0) return;
        this.additionalSharedSlots += qty;
        this.updated.fire();
    }

    public removeAdditionalSlot(qty = 1) {
        if (qty <= 0) return;
        this.additionalSharedSlots = math.max(0, this.additionalSharedSlots - qty);
        this.updated.fire();
    }

    public toDTO(): BuildingComponentDTO {
        const cm = this.region.getOwner().getConstructionManager();

        const slots = new Map<Building, number>();
        for (const [id, building] of pairs(Building)) {
            const def = BuildingDefs[building];
            if (def.type === BuildingType.Region) {
                slots.set(building, def.maxLevel);
            } else if (def.type === BuildingType.Shared) {
                // For UI/DTO purposes, expose the *current* limit this building could reach now.
                slots.set(building, this.getSlotCount(building));
            }
        }

        const ongoing = cm.getConstructionsIn(this.region);
        const planned = new Map<Building, number>();
        ongoing.forEach((project) => {
            planned.set(project.type, (planned.get(project.type) ?? 0) + 1);
        });

        return {type: "region", built: this.buildings, planned, slots};
    }
}

export class NationBuildingComponent {
    private counter = new Map<string, number>();
    public updated = new Signal<[]>(); // emits when any nation count changes

    constructor(private nation: Nation) {}

    private key(building: Building): string {
        return BuildingDefs[building].id;
    }

    public get(building: Building): number {
        return this.counter.get(this.key(building)) ?? 0;
    }

    public set(building: Building, qty: number) {
        const k = this.key(building);
        const v = math.max(0, qty);
        const prev = this.counter.get(k) ?? 0;
        if (v === prev) return;
        this.counter.set(k, v);
        this.updated.fire();
    }

    public addDelta(building: Building, delta: number) {
        if (delta === 0) return;
        const k = this.key(building);
        const prev = this.counter.get(k) ?? 0;
        const nextt = math.max(0, prev + delta);
        if (nextt === prev) return;
        this.counter.set(k, nextt);
        this.updated.fire();
    }

    public toDTO() {
        // Flatten to a simple { [defId: string]: number } for the wire if needed
        const out: Record<string, number> = {};
        for (const [k, v] of this.counter) out[k] = v;
        return out;
    }
}
