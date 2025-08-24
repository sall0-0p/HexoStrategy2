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
        icon: "rbxassetid://109018347927070",
    },
    [ResourceType.Oil]: {
        name: "Oil",
        icon: "rbxassetid://116220862621129",
    },
    [ResourceType.Aluminium]: {
        name: "Aluminium",
        icon: "rbxassetid://100381251028112",
    },
    [ResourceType.Rubber]: {
        name: "Rubber",
        icon: "rbxassetid://108807152636823",
    },
    [ResourceType.Electronics]: {
        name: "Electronics",
        icon: "rbxassetid://81856628649317",
    },
    [ResourceType.Alloys]: {
        name: "Rare Alloys",
        icon: "rbxassetid://70430714365340",
    },
    [ResourceType.Uranium]: {
        name: "Uranium",
        icon: "rbxassetid://96174045205912",
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