import {BuildingDef, BuildingType} from "../../types/BuildingDef";
import {ModifiableProperty} from "../../constants/ModifiableProperty";
import {Definitions} from "../../constants/Definitions";
import {RTColor} from "../../constants/RichText";

export enum Building {
    Infrastructure = "infrastructure",
    CivilianFactory = "civilianFactory",
    MilitaryFactory = "militaryFactory",
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
        menuOrder: 1,
        modifier: ModifiableProperty.InfrastructureBuildSpeed,
    },
    civilianFactory: {
        id: "civilianFactory",
        name: "Civilian Factory",
        description: `Civilian Factories are used to construct new buildings. Each generates base <color value="${RTColor.Important}">${Definitions.BaseFactoryConstructionOutput}</color> points each day. They are also used for trade and special projects.`,
        icon: "rbxassetid://115581448311350",
        iconColor3: Color3.fromRGB(255, 187, 61),
        type: BuildingType.Shared,
        buildCost: 20000,
        maxLevel: 25,
        menuOrder: 1,
        modifier: ModifiableProperty.CivilianFactoryBuildSpeed,
    },
    militaryFactory: {
        id: "militaryFactory",
        name: "Military Factory",
        description: `Military factory description will be here eventually.`,
        icon: "rbxassetid://115581448311350",
        iconColor3: Color3.fromRGB(132, 173, 98),
        type: BuildingType.Shared,
        buildCost: 14000,
        maxLevel: 25,
        menuOrder: 2,
        modifier: ModifiableProperty.MilitaryFactoryBuildSpeed,
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
        menuOrder: 1,
        modifier: ModifiableProperty.LandFortBuildSpeed,
    }
};