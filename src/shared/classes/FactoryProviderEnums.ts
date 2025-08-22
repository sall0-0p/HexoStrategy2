import {ModifiableProperty} from "./ModifiableProperty";

export enum FactorySourceType {
    Building = "building",
    TradeExports = "exports",
}

export enum FactoryReservationType {
    ConsumerGoods = "goods",
    TradeImports = "imports",
}

export interface FactoryReservationDef {
    name: string,
    description: string,
    icon: string,
    modifier: ModifiableProperty,
    layoutOrder: number,
}

export interface FactorySourceDef {
    name: string,
}