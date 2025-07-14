import {StatsTemplate} from "../../../classes/StatsTemplate";
import {UnitType} from "../../../classes/UnitType";

export interface UnitTemplateDTO {
    id: string;
    name: string;
    stats: StatsTemplate;
    modelName: string;
    icon: string;
    ownerId: string;
    ownerName: string;
    unitType: UnitType;
}