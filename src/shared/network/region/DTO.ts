import {StateCategory} from "../../classes/StateCategory";

export interface RegionDTO {
    id: string,
    name: string,
    category: string,
    hexes: string[],
    owner: string,
    population: number,
}