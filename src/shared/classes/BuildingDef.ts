import {ModifiableProperty} from "./ModifiableProperty";

export enum BuildingType {
    Shared = "shared",
    Hex = "hex",
    Region = "region",
}

export interface BuildingDef {
    id: string,
    name: string,
    type: BuildingType,
    buildCost: number,
    upgradeCost?: number,
    maxLevel: number,
    modifier: ModifiableProperty,
}