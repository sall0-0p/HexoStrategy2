import {
    FactorySourceDef,
    FactorySourceType
} from "../../constants/FactoryDef";

export const FactorySourceDefs: Record<FactorySourceType, FactorySourceDef> = {
    [FactorySourceType.Building]: {
        name: "Owned",
    },
    [FactorySourceType.TradeExports]: {
        name: "Exports",
    }
}