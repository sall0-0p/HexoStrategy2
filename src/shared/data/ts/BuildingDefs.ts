import {BuildingDef, BuildingType} from "../../classes/BuildingDef";
import {ModifiableProperty} from "../../classes/ModifiableProperty";
import {Definition} from "../../config/Definition";
import {RTColor} from "../../config/RichText";

export enum Building {
    Infrastructure = "infrastructure",
    CivilianFactory = "civilianFactory",
    LandFort = "landFort",
}

export const BuildingDefs: Record<string, BuildingDef> = {
    infrastructure: {
        id: "infrastructure",
        name: "Infrastructure",
        description: 'Infrastructure improves movement speed of units, as well as supply capacity of hexes in a region.',
        icon: "rbxassetid://104256052446767",
        type: BuildingType.Region,
        buildCost: 5000,
        maxLevel: 5,
        modifier: ModifiableProperty.InfrastructureBuildSpeed,
    },
    civilianFactory: {
        id: "civilianFactory",
        name: "Civilian Factory",
        description: `Civilian Factories are used to construct new buildings. Each generates base <color value="${RTColor.Important}">${Definition.BaseFactoryConstructionOutput}</color> points each day. They are also used for trade and special projects.`,
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
        description: `Land forts make it easier for your forces to defend. Each land fort level stacks <color value="${RTColor.Green}">-15%</color> to enemy attack, capped at <color value="${RTColor.Green}">-85%</color>. Forts can be mitigated by using engineers or attacking from multiple directions.`,
        icon: "rbxassetid://87491028819292",
        type: BuildingType.Hex,
        buildCost: 500,
        upgradeCost: 500,
        maxLevel: 10,
        modifier: ModifiableProperty.LandFortBuildSpeed,
    }
};