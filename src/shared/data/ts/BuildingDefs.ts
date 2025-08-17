import {BuildingDef, BuildingType} from "../../classes/BuildingDef";
import {ModifiableProperty} from "../../classes/ModifiableProperty";

export enum Building {
    Infrastructure = "infrastructure",
    CivilianFactory = "civilianFactory",
    LandFort = "landFort",
}

export const BuildingDefs: Record<string, BuildingDef> = {
    infrastructure: {
        id: "infrastructure",
        name: "Infrastructure",
        icon: "rbxassetid://104256052446767",
        type: BuildingType.Region,
        buildCost: 5000,
        upgradeCost: 1000,
        maxLevel: 5,
        modifier: ModifiableProperty.InfrastructureBuildSpeed,
    },
    civilianFactory: {
        id: "civilianFactory",
        name: "Civilian Factory",
        icon: "rbxassetid://115581448311350",
        iconColor3: Color3.fromRGB(255, 187, 61),
        type: BuildingType.Shared,
        buildCost: 20000,
        upgradeCost: 3000,
        maxLevel: 20,
        modifier: ModifiableProperty.CivilianFactoryBuildSpeed,
    },
    landFort: {
        id: "landFort",
        name: "Fortifications",
        icon: "rbxassetid://87491028819292",
        type: BuildingType.Hex,
        buildCost: 1000,
        upgradeCost: 250,
        maxLevel: 10,
        modifier: ModifiableProperty.LandFortBuildSpeed,
    }
};