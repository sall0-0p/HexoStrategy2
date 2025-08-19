import {BuildingType} from "../../../shared/classes/BuildingDef";
import {Hex} from "../hex/Hex";
import {Region} from "../region/Region";
import {ModifiableProperty} from "../../../shared/classes/ModifiableProperty";
import {Nation} from "../nation/Nation";
import {Building, BuildingDefs} from "../../../shared/data/ts/BuildingDefs";
import {BuildingComponentDTO} from "../../../shared/network/building/BuildingComponentDTO";
import {Signal} from "../../../shared/classes/Signal";

export abstract class BuildingComponent {
    protected buildings = new Map<Building, number>;
    public updated = new Signal<[]>();

    public getBuildingCount(building: Building): number {
        return this.buildings.get(building) ?? 0;
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

    public addBuilding(building: Building, qty = 1) {
        const def = BuildingDefs[building];
        if (def.type !== "hex") error(`Attempting to add building designated for ${def.type} to Hex building component!`);

        const count = (this.buildings.get(building) ?? 0) + qty;
        if (count > this.getSlotCount(building)) return;
        this.buildings.set(building, count);
        this.updated.fire();

        const aggregator = this.hex.getOwner()?.getBuildings();
        if (!aggregator) return;
        aggregator.set(building, aggregator.get(building) + qty);
    }

    public removeBuilding(building: Building, qty = 1): void {
        const count = (this.buildings.get(building) ?? 0) - qty;
        const clamped = math.clamp(count, 0, math.huge);
        this.buildings.set(building, clamped);
        this.updated.fire();

        const aggregator = this.hex.getOwner()?.getBuildings();
        if (!aggregator) return;
        aggregator.set(building, aggregator.get(building) - qty);
    }

    public setBuilding(building: Building, qty: number) {
        const def = BuildingDefs[building];
        if (def.type !== "hex") error(`Attempting to add building designated for ${def.type} to Hex building component!`);

        if (qty > this.getSlotCount(building)) return;
        const oldCount = this.buildings.get(building) ?? 0;

        this.buildings.set(building, qty);

        const diff = qty - oldCount;
        if (diff !== 0) {
            const aggregator = this.hex.getOwner()?.getBuildings();
            if (aggregator) {
                // increment or decrement by the difference
                aggregator.set(building, aggregator.get(building) + diff);
            }
        }

        this.updated.fire();

        // TODO: Add aggregator
    }

    public toDTO(): BuildingComponentDTO {
        const cm = this.hex.getRegion().getOwner().getConstructionManager();
        let slots = new Map<Building, number>();
        for (const [id, building] of pairs(Building)) {
            const def = BuildingDefs[building];
            if (def.type === BuildingType.Hex) {
                slots.set(building, this.getSlotCount(building));
            }
        }

        const ongoing = cm.getConstructionsIn(this.hex);
        const planned = new Map<Building, number>;
        ongoing.forEach((project) => {
            planned.set(project.type, (planned.get(project.type) ?? 0) + 1);
        });

        return {
            type: "hex",
            built: this.buildings,
            planned,
            slots,
        }
    }
}

export class RegionBuildingComponent extends BuildingComponent {
    private region: Region;
    constructor(region: Region) {
        super();
        this.region = region;
    }

    public getSlotCount(building: Building) {
        const def = BuildingDefs[building];
        if (def.type === "region") {
            return def.maxLevel;
        } else {
            const base = this.region.getCategory().sharedSlots;
            const modified = this.region.getModifiers().getEffectiveValue(base, [ModifiableProperty.MaxSharedSlotsInRegion]);
            const floored = math.floor(modified);
            const additional = this.additionalSharedSlots.get(building) ?? 0;
            return math.min(floored + additional, def.maxLevel);
        }
    }

    public addBuilding(building: Building, qty = 1) {
        const def = BuildingDefs[building];
        if (def.type === "hex") error(`Attempting to add building designated for hex to Region building component!`);

        const count = (this.buildings.get(building) ?? 0) + qty;
        if (count > this.getSlotCount(building)) return;
        this.buildings.set(building, count);
        this.updated.fire();

        const aggregator = this.region.getOwner().getBuildings();
        aggregator.set(building, aggregator.get(building) + qty);
    }

    public removeBuilding(building: Building, qty = 1): void {
        const count = (this.buildings.get(building) ?? 0) - qty;
        const clamped = math.clamp(count, 0, math.huge);
        this.buildings.set(building, clamped);
        this.updated.fire();

        const aggregator = this.region.getOwner().getBuildings();
        aggregator.set(building, aggregator.get(building) - qty);
    }

    public setBuilding(building: Building, qty: number) {
        const def = BuildingDefs[building];
        if (def.type === "hex") error(`Attempting to set building designated for hex to Region building component!`);

        if (qty > this.getSlotCount(building)) return;
        const oldCount = this.buildings.get(building) ?? 0;
        this.buildings.set(building, qty);
        this.updated.fire();

        const diff = qty - oldCount;
        if (diff !== 0) {
            const aggregator = this.region.getOwner().getBuildings();
            aggregator.set(building, aggregator.get(building) + diff);
        }
    }

    // Additional building slots
    private additionalSharedSlots = new Map<string, number>;

    public addAdditionalSlot(building: Building, qty = 1) {
        const count = this.buildings.get(building) ?? 0;
        this.additionalSharedSlots.set(building, count + qty);
        this.updated.fire();
    }

    public removeAdditionSlot(building: Building, qty = 1) {
        const count = this.buildings.get(building) ?? 0;
        const clamped = math.clamp(count - qty, 0, math.huge)
        this.additionalSharedSlots.set(building, clamped);
        this.updated.fire();
    }

    public toDTO(): BuildingComponentDTO {
        const cm = this.region.getOwner().getConstructionManager();
        let slots = new Map<Building, number>();
        for (const [id, building] of pairs(Building)) {
            const def = BuildingDefs[building];
            if (def.type === BuildingType.Region || def.type === BuildingType.Shared) {
                slots.set(building, this.getSlotCount(building));
            }
        }

        const ongoing = cm.getConstructionsIn(this.region);
        const planned = new Map<Building, number>;
        ongoing.forEach((project) => {
            planned.set(project.type, (planned.get(project.type) ?? 0) + 1);
        });

        return {
            type: "region",
            built: this.buildings,
            planned,
            slots,
        }
    }
}

export class NationBuildingComponent {
    private counter = new Map<string, number>;

    constructor(private nation: Nation) {}

    public get(building: Building): number {
        const def = BuildingDefs[building];
        return this.counter.get(def.id) ?? 0;
    }

    public set(building: Building, qty: number) {
        const def = BuildingDefs[building];
        this.counter.set(def.id, qty);
    }

    public toDTO() {

    }
}