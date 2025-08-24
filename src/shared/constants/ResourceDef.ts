export interface ResourceDef {
    name: string,
    icon: string,
}

export enum ResourceType {
    Steel = "steel",
    Aluminium = "aluminium",
    Oil = "oil",
    Rubber = "rubber",
    Electronics = "electronics",
    Alloys = "alloys",
    Uranium = "uranium",
}

export type ResourceMap = Map<ResourceType, number>;

export enum ResourceSourceType {
    Region = "region",
    TradeImports = "imports",
}

export interface ResourceSourceDef {
    name: string,
}

export enum ResourceReservationType {
    TradeExports = "exports",
}

export interface ResourceReservationDef {
    name: string,
}