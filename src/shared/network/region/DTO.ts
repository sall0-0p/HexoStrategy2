import {BuildingComponentDTO} from "../building/BuildingComponentDTO";
import {ResourceMap} from "../../constants/ResourceDef";

export interface RegionDTO {
    id: string,
    name: string,
    category: string,
    hexes: string[],
    owner: string,
    population: number,
    buildings: BuildingComponentDTO,
    resources: ResourceMap,
}