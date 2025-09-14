import {EquipmentArchetype, LandEquipmentArchetype} from "../../constants/EquipmentArchetype";

export interface EquipmentArchetypeDef {
    name: string,
    description: string,
    genericIcon: string,
}

export const EquipmentArchetypeDefs: Record<EquipmentArchetype, EquipmentArchetypeDef> = {
    [LandEquipmentArchetype.InfantryEquipment]: {
        name: "Infantry Equipment",
        description: "",
        genericIcon: "rbxassetid://80698323418128",

    },
    [LandEquipmentArchetype.MediumTank]: {
        name: "Medium Tank",
        description: "",
        genericIcon: "rbxassetid://85647464714267",
    }
}