import {Building} from "../../data/ts/BuildingDefs";
import {ResourceMap, ResourceReservationType, ResourceSourceType} from "../../constants/ResourceDef";

export interface NationDTO {
    id: string,
    name: string,
    color: Color3,
    flag: string,
    player?: Player,
    allies: string[],
    enemies: string[],
    building: [Building, number][],
    resources: NationResourceDTO,
}

export interface NationResourceDTO {
    total: ResourceMap,
    reserved: ResourceMap,
    available: ResourceMap,
    sources?: Map<ResourceSourceType, ResourceMap>;
    reservations?: Map<ResourceReservationType, ResourceMap>;
}