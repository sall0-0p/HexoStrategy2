import {ModifiableProperty} from "./ModifiableProperty";

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
}