import {ModifiableProperty} from "./ModifiableProperty";

export enum ModifierParent {
    Unit = "Unit_",
    Nation = "Nation_",
    Region = "Region_",
    Hex = "Hex_",
}

export enum ModifierType {
    Additive = "add",
    Multiplicative = "mul",
    Flat = "value",
}

export interface Modifier {
    id: string;
    property: ModifiableProperty;
    type: ModifierType;
    value: number;
    expireAt?: number;

    // UI
    label?: string;
    icon?: string;
    iconColor?: Color3;
}