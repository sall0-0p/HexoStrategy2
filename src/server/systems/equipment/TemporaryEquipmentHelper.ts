import {EquipmentArchetype, LandEquipmentArchetype} from "../../../shared/constants/EquipmentArchetype";
import {LandEquipmentType} from "./type/LandEquipmentType";
import {Nation} from "../../world/nation/Nation";

export namespace TemporaryEquipmentHelper {
    export function create(owner: Nation, a: LandEquipmentArchetype) {
        return new LandEquipmentType(owner, a, a as string, "", {
            speed: 0,
            hp: 0,
            organisation: 0,
            recovery: 0,
            softAttack: 0,
            hardAttack: 0,
            defence: 0,
            breakthrough: 0,
            armor: 0,
            piercing: 0,
            initiative: 0,
            hardness: 0,
        });
    }
}