import {BuildingDef, BuildingType} from "../../classes/BuildingDef";
import {ModifiableProperty} from "../../classes/ModifiableProperty";

export enum Building {
    Infrastructure = "infrastructure",
    CivilianFactory = "civilianFactory",
}

export const BuildingDefs: Record<string, BuildingDef> = {
    infrastructure: {
        id: "infrastructure",
        name: "Infrastructure",
        type: BuildingType.Region,
        buildCost: 5000,
        upgradeCost: 1000,
        maxLevel: 5,
        modifier: ModifiableProperty.InfrastructureBuildSpeed,
    },
    civilianFactory: {
        id: "civilianFactory",
        name: "Civilian Factory",
        type: BuildingType.Shared,
        buildCost: 20000,
        upgradeCost: 3000,
        maxLevel: 20,
        modifier: ModifiableProperty.CivilianFactoryBuildSpeed,
    },
};