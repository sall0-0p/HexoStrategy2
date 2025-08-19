import {Building} from "../../data/ts/BuildingDefs";

export interface BuildingComponentDTO {
    type: "region" | "hex";
    built: Map<Building, number>;
    planned: Map<Building, number>;
    slots: Map<Building, number>;
}