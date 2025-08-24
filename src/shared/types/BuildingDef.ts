import {ModifiableProperty} from "../constants/ModifiableProperty";
import {ResourceMap, ResourceType} from "../constants/ResourceDef";

export enum BuildingType {
    Shared = "shared",
    Hex = "hex",
    Region = "region",
}

export interface BuildingDef {
    id: string,
    name: string,
    description: string,
    icon: string,
    iconColor3?: Color3,
    type: BuildingType,
    buildCost: number,
    upgradeCost?: number,
    maxLevel: number,
    menuOrder: number,
    modifier: ModifiableProperty,
    resources?: { [key in ResourceType]?: number },
}