import {Building} from "../../data/ts/BuildingDefs";

export interface NationDTO {
    id: string,
    name: string,
    color: Color3,
    flag: string,
    player?: Player,
    allies: string[],
    enemies: string[],
    building: [Building, number][],
}