import {Battle} from "../Battle";
import {Unit} from "../../unit/Unit";
import {ArrayShuffle} from "../../../../shared/functions/ArrayShuffle";
import {Accountant} from "./Accountant";
import {ModifiableProperty} from "../../../../shared/constants/ModifiableProperty";
import {ReserveManager} from "./ReserveManager";
import {Building, BuildingDefs} from "../../../../shared/data/ts/BuildingDefs";
import {Definitions} from "../../../../shared/constants/Definitions";

export namespace CombatEngine {
    function selectTargets(attacker: Unit, enemies: Unit[]) {
        if (enemies.size() === 0) return [];
        const engagementWidth = attacker.getCombatWidth() * 2;
        const shuffled = ArrayShuffle.shuffle([...enemies]) as Unit[];
        const fit: Unit[] = [];
        let used = 0;

        shuffled.some((enemy) => {
            const cw = enemy.getCombatWidth();
            if (used + cw <= engagementWidth) {
                fit.push(enemy);
                used += cw;
                return false;
            } else {
                return true;
            }
        })

        if (fit.size() > 0) {
            return fit;
        } else {
            return [shuffled[math.random(0, shuffled.size() - 1)]];
        }
    }

    function rateTargets(attacker: Unit, targets: Unit[]) {
        const scored = targets.map((target) => {
            const hardnessFactor =
                ((attacker.getHardAttack() * (1 - target.getHardness())) +
                    (attacker.getSoftAttack()  *  target.getHardness()))  // blend soft vs. hard
                / math.max(target.getCombatWidth(), 1);
            const armorMultiplier = target.getArmor() > attacker.getPiercing() ? 0.5 : 1;
            const orgRatio = target.getOrganisation() / target.getMaxOrganisation();
            const orgBonus = 1 - (orgRatio / 4);

            const score = hardnessFactor * armorMultiplier * orgBonus;
            return { target, score };
        })

        scored.sort((a, b) => a.score > b.score);
        return scored.map(entry => entry.target);
    }

    function allocateAttacks(unit: Unit, targets: Unit[], count: number) {
        if (count <= 0) return new Map<Unit, number>();
        const coordinatedShare = 0.35 * (1 + unit.getInitiative());
        const coordinatedCount = math.clamp(math.floor(count * coordinatedShare), 0, count);
        const normalCount = count - coordinatedCount;
        const rating = rateTargets(unit, targets);
        const target = rating[0];

        let totalWidth = 0;
        targets.forEach((t) => totalWidth += t.getCombatWidth());

        let uncoordinatedCount = 0;
        const uncoordinated = new Map<Unit, number>();
        targets.forEach((target) => {
            const share = target.getCombatWidth() / totalWidth;
            uncoordinated.set(target, math.floor(normalCount * share));
            uncoordinatedCount += math.floor(normalCount * share);
        })

        uncoordinated.set(target, (uncoordinated.get(target) ?? 0) + coordinatedCount);
        return uncoordinated;
    }

    function attack(battle: Battle, unit: Unit, target: Unit) {
        const defences = ReserveManager.getDefences(battle, target) ?? 0;
        const hitChance = (defences > 0) ? 0.1 : 0.4;
        const roll = math.random(0, 100) * 0.01;

        if (roll > hitChance) return;

        const unitHp = unit.getHp() / unit.getMaxHp();
        const orgDieSize = unit.getArmor() > target.getPiercing() ? 6 : 4;
        const hpDamage = (math.random(1, 2) * 0.06) * unitHp;
        const orgDamage = ((math.random(1, orgDieSize)) * 0.053) * unitHp;

        target.setHp(target.getHp() - hpDamage);
        target.setOrganisation(target.getOrganisation() - orgDamage);
    }

    export function tick(battle: Battle, unit: Unit, isDefender: boolean) {
        const units = battle.getUnits();
        const maxWidth = Accountant.computeMaxWidth(battle);
        const allies = isDefender ? units.defendingFrontline : units.attackingFrontline;
        const enemies = isDefender ? units.attackingFrontline : units.defendingFrontline;
        const targets = selectTargets(unit, enemies);
        if (targets.size() === 0) return;

        const totalWidth = allies.reduce((sum, u) => sum + u.getCombatWidth(), 0);
        const over = totalWidth - maxWidth;

        let sumHardness = 0;
        targets.forEach((t) => sumHardness += t.getHardness());
        const averageHardness = sumHardness / targets.size();

        const baseAttack = averageHardness * unit.getHardAttack()
            + (1 - averageHardness) * unit.getSoftAttack();
        let totalAttack = unit.getModifiers().getEffectiveValue(baseAttack, [ModifiableProperty.UnitTotalAttack]);

        // Apply over combat width penalty
        if (over > 0) {
            const penalty = -1 * over / maxWidth;
            totalAttack *= (1 + penalty);
        }

        // Apply fortification penalty (-15% per level, but more attacking directions should cancel out.
        const buildings = battle.getHex().getBuildings();
        const fortCount = buildings.getBuildingCount(Building.LandFort);
        if (fortCount > 0 && !isDefender) {
            const flanks = Accountant.getAttackingHexes(battle).size() - 1;
            const adjustedFortCount = math.clamp(fortCount - flanks, 1, BuildingDefs[Building.LandFort].maxLevel);
            const basePenalty = (adjustedFortCount * Definitions.LandFortAttackPenaltyPerLevel);
            const penalty = unit.getModifiers().getEffectiveValue(basePenalty, [ModifiableProperty.EnemyLandFortEffectiveness]);
            totalAttack *= (1 - math.clamp(penalty, 0, Definitions.MaxLandFortAttackDebuff));
        }

        const attackCount = math.round(totalAttack / 10);
        const attacks = allocateAttacks(unit, targets, attackCount);
        attacks.forEach((count, target) => {
            for (let i = 0; i < count; i++) {
                attack(battle, unit, target);
            }
        });

        Accountant.setAttacks(battle, unit, math.round(totalAttack));
    }
}