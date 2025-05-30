import {DiplomaticRelation} from "../../server/systems/diplomacy/DiplomaticRelation";

export interface NationDTO {
    id: string,
    name: string,
    color: Color3,
    flag: string,
    player?: Player,
    allies: string[],
    enemies: string[],
}