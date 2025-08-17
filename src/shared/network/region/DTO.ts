import {BuildingComponentDTO} from "../building/BuildingComponentDTO";

export interface RegionDTO {
    id: string,
    name: string,
    category: string,
    hexes: string[],
    owner: string,
    population: number,
    buildings: BuildingComponentDTO,
}