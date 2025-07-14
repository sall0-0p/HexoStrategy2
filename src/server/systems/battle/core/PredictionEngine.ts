// src/battle/core/PredictionEngine.ts
import {Battle} from "../Battle";
import {Unit} from "../../unit/Unit";
import {ModifiableProperty} from "../../../../shared/classes/ModifiableProperty";

export interface BattlePrediction {
    hours: number;
    score: number;
}

export namespace PredictionEngine {
    export function predictOutcome(battle: Battle): BattlePrediction {
        const {attackingFrontline, defendingFrontline, attackingReserve, defendingReserve} = battle.getUnits();
        const atkOrg = attackingFrontline.reduce((s, u) => s + u.getOrganisation(), 0);
        const defOrg = defendingFrontline.reduce((s, u) => s + u.getOrganisation(), 0);
        const atkResOrg = attackingReserve.reduce((s, u) => s + math.floor(u.getOrganisation() * 0.25), 0);
        const defResOrg = defendingReserve.reduce((s, u) => s + math.floor(u.getOrganisation() * 0.25), 0);

        const frontAtkDmg = approximateDamagePerHour(attackingFrontline, defendingFrontline, false);
        const frontDefDmg = approximateDamagePerHour(defendingFrontline, attackingFrontline, true);
        const reserveAtkDmg = approximateDamagePerHour(attackingReserve, defendingFrontline, false) * 0.25;
        const reserveDefDmg = approximateDamagePerHour(defendingReserve, attackingFrontline, true) * 0.25;

        const atkDmg = frontAtkDmg + reserveAtkDmg;
        const defDmg = frontDefDmg + reserveDefDmg;

        const hoursToKillDef = (defOrg + defResOrg) / atkDmg;
        const hoursToKillAtk = (atkOrg + atkResOrg) / defDmg;

        const hours = math.min(hoursToKillDef, hoursToKillAtk) * 0.75;
        const score = (hoursToKillAtk - hoursToKillDef) / math.max(hoursToKillAtk, hoursToKillDef);

        return {hours, score};
    }

    function approximateDamagePerHour(attackers: Unit[], defenders: Unit[], useBreak: boolean): number {
        let totalA = 0;
        let totalD = 0;

        attackers.forEach(u => {
            const h = averageHardness(defenders);
            const base = h * u.getHardAttack() + (1 - h) * u.getSoftAttack();
            const val = u.getModifiers().getEffectiveValue(base, [ModifiableProperty.UnitTotalAttack]);
            totalA += math.round(val / 10);
        });

        defenders.forEach(u => {
            const stat = useBreak ? u.getBreakthrough() : u.getDefence();
            totalD += math.round(stat / 10);
        });

        const withD = math.min(totalA, totalD);
        const without = math.max(0, totalA - totalD);
        const hits = withD * 0.1 + without * 0.4;
        const orgPer = 2.5 * 0.053;

        return math.max(hits * orgPer, 0.01);
    }

    function averageHardness(units: Unit[]): number {
        if (units.size() === 0) return 0;
        let sum = 0;
        units.forEach(u => sum += u.getHardness());
        return sum / units.size();
    }
}
