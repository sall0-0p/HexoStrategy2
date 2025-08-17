import {BuildingComponentDTO} from "../building/BuildingComponentDTO";

export interface HexDTO {
    id: string,
    name: string,
    q: number,
    r: number,
    owner?: string, // owner
    neighbors: string[], // neighbors
    buildings: BuildingComponentDTO,
    model: Model,
}