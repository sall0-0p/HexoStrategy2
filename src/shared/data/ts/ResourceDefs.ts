import {
    ResourceDef,
    ResourceReservationDef, ResourceReservationType,
    ResourceSourceDef,
    ResourceSourceType,
    ResourceType
} from "../../constants/ResourceDef";

export const ResourceDefs: Record<ResourceType, ResourceDef> = {
    [ResourceType.Steel]: {
        name: "Steel",
        icon: "rbxassetid://100113446854818",
        layoutOrder: 1,
    },
    [ResourceType.Oil]: {
        name: "Oil",
        icon: "rbxassetid://92821626956496",
        layoutOrder: 2,
    },
    [ResourceType.Aluminium]: {
        name: "Aluminium",
        icon: "rbxassetid://72161205517059",
        layoutOrder: 3,
    },
    [ResourceType.Rubber]: {
        name: "Rubber",
        icon: "rbxassetid://81984590782381",
        layoutOrder: 4,
    },
    [ResourceType.Electronics]: {
        name: "Electronics",
        icon: "rbxassetid://114754949273831",
        layoutOrder: 5,
    },
    [ResourceType.Alloys]: {
        name: "Rare Alloys",
        icon: "rbxassetid://95601836379910",
        layoutOrder: 6,
    },
    [ResourceType.Uranium]: {
        name: "Uranium",
        icon: "rbxassetid://87045635631128",
        layoutOrder: 7,
    }
}


export const ResourceSourceDefs: Record<ResourceSourceType, ResourceSourceDef> = {
    [ResourceSourceType.Region]: {
        name: "Regions",
    },
    [ResourceSourceType.TradeImports]: {
        name: "Imports",
    },
}

export const ResourceReservationDefs: Record<ResourceReservationType, ResourceReservationDef> = {
    [ResourceReservationType.TradeExports]: {
        name: "Exports",
    }
}