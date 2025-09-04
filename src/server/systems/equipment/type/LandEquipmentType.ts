import {EquipmentType} from "./EquipmentType";
import {LandEquipmentArchetype} from "../../../../shared/constants/EquipmentArchetype";
import {LandEquipmentStats} from "../../../../shared/types/EquipmentStats";
import {Nation} from "../../../world/nation/Nation";

export class LandEquipmentType extends EquipmentType {
    constructor(owner: Nation, archetype: LandEquipmentArchetype, name: string, icon: string, private stats: LandEquipmentStats, parent?: LandEquipmentType) {
        super(owner, archetype, name, icon, parent);
    }

    public clone(owner: Nation, name: string, delta?: Partial<LandEquipmentStats>) {

    }
}