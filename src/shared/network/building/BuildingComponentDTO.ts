import {Building} from "../../data/ts/BuildingDefs";

export interface BuildingComponentDTO {
    type: "region" | "hex";
    buildings: Map<Building, number>;
    slots: Map<Building, number>;
}