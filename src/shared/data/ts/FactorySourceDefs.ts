import {
    FactorySourceDef,
    FactorySourceType
} from "../../classes/FactoryProviderEnums";

export const FactorySourceDefs: Record<FactorySourceType, FactorySourceDef> = {
    [FactorySourceType.Building]: {
        name: "Owned",
    },
    [FactorySourceType.TradeExports]: {
        name: "Exports",
    }
}