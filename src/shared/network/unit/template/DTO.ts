import {StatsTemplate} from "../../../types/StatsTemplate";
import {UnitType} from "../../../constants/UnitType";

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