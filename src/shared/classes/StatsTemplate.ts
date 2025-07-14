import {UnitType} from "./UnitType";

export interface StatsTemplate {
    speed: number;
    hp: number;
    organisation: number;
    recovery: number;
    softAttack: number;
    hardAttack: number;
    defence: number;
    breakthrough: number;
    armor: number;
    piercing: number;
    initiative: number;
    combatWidth: number;
    hardness: number;
    unitType: UnitType;
}