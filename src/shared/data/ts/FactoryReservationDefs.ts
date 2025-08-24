import {FactoryReservationDef, FactoryReservationType} from "../../constants/FactoryDef";
import {ModifiableProperty} from "../../constants/ModifiableProperty";

export const FactoryReservationDefs: Record<FactoryReservationType, FactoryReservationDef> = {
    [FactoryReservationType.ConsumerGoods]: {
        name: "Consumer Goods",
        description: "",
        icon: "rbxassetid://118475356537556",
        modifier: ModifiableProperty.CivilianGoodsFactor,
        layoutOrder: 1
    },
    [FactoryReservationType.TradeImports]: {
        name: "Resource Imports",
        description: "",
        icon: "rbxassetid://83599650530394",
        modifier: ModifiableProperty.ImportFactoryCost,
        layoutOrder: 2
    }
}