import {Battle} from "../Battle";
import {Hex} from "../../../world/hex/Hex";
import {Unit} from "../../unit/Unit";

export namespace Accountant {
    export function getFlanks(battle: Battle) {
        const units = battle.getUnits();

        const allAttackers = [ ...units.attackingFrontline, ...units.attackingReserve ];
        const directions: Set<Hex> = new Set();

        allAttackers.forEach((unit) => directions.add(unit.getPosition()));
        return directions;
    }

    export function computeMaxWidth(battle: Battle) {
        const baseWidth = 70;
        const flankWidth = baseWidth / 2;

        return baseWidth + (flankWidth * getFlanks(battle).size());
    }

    // Attacks
    const attacks = new Map<Battle, Map<Unit, number>>;

    export function resetAttacks(battle: Battle) {
        attacks.get(battle)?.clear();
    }

    export function getAttacks(battle: Battle, unit: Unit) {
        return attacks.get(battle)?.get(unit);
    }

    export function setAttacks(battle: Battle, unit: Unit, count: number) {
        if (!attacks.has(battle)) {
            attacks.set(battle, new Map());
        }

        attacks.get(battle)!.set(unit, count);
    }

    // Powers

    export function computePowers(battle: Battle): Map<Unit, number> {
        const units = battle.getUnits();
        const attackingReserve = units.attackingReserve;
        const defendingReserve = units.defendingReserve;

        const allReserves = [...attackingReserve, ...defendingReserve];

        let maxSoft = 0;
        let maxHard = 0;
        let maxDef  = 0;
        let maxBreak = 0;
        let maxArmor = 0;
        let maxPierce = 0;

        allReserves.forEach(u => {
            maxSoft    = math.max(maxSoft,    u.getSoftAttack());
            maxHard    = math.max(maxHard,    u.getHardAttack());
            maxDef     = math.max(maxDef,     u.getDefence());
            maxBreak   = math.max(maxBreak,   u.getBreakthrough());
            maxArmor   = math.max(maxArmor,   u.getArmor());
            maxPierce  = math.max(maxPierce,  u.getPiercing());
        });

        const attackingAll = [...units.attackingFrontline, ...attackingReserve];
        const defendingAll = [...units.defendingFrontline, ...defendingReserve];

        const attackingHardness = averageHardness(attackingAll);
        const defendingHardness = averageHardness(defendingAll);

        const powers = new Map<Unit, number>();

        attackingReserve.forEach(unit => {
            let firepower = 0;
            firepower += math.clamp(unit.getSoftAttack()   / maxSoft,   0, 1) * (1 - defendingHardness);
            firepower += math.clamp(unit.getHardAttack()   / maxHard,   0, 1) * defendingHardness;
            firepower += math.clamp(unit.getPiercing()     / maxPierce, 0, 1) * defendingHardness;
            firepower += math.clamp(unit.getBreakthrough() / maxBreak,  0, 1) * 0.5;
            firepower += math.clamp(unit.getArmor()        / maxArmor,  0, 1) * 0.5;

            const health = math.min(
                unit.getHp() / unit.getMaxHp(),
                unit.getOrganisation() / unit.getMaxOrganisation()
            );
            const basePower = (firepower * health) / math.max(unit.getCombatWidth(), 1);
            const bonus     = unit.getInitiative() * 0.05;

            powers.set(unit, basePower + bonus);
        });

        defendingReserve.forEach(unit => {
            let firepower = 0;
            firepower += math.clamp(unit.getSoftAttack()   / maxSoft,   0, 1) * (1 - attackingHardness);
            firepower += math.clamp(unit.getHardAttack()   / maxHard,   0, 1) * attackingHardness;
            firepower += math.clamp(unit.getPiercing()     / maxPierce, 0, 1) * attackingHardness;
            firepower += math.clamp(unit.getDefence()      / maxDef,     0, 1);
            firepower += math.clamp(unit.getArmor()        / maxArmor,   0, 1) * 0.25;

            const health = math.min(
                unit.getHp() / unit.getMaxHp(),
                unit.getOrganisation() / unit.getMaxOrganisation()
            );
            const basePower = (firepower * health) / math.max(unit.getCombatWidth(), 1);
            const bonus     = unit.getInitiative() * 0.05;

            powers.set(unit, basePower + bonus);
        });

        return powers;
    }

    function averageHardness(units: Unit[]): number {
        if (units.size() === 0) return 0;
        const sum = units.reduce((acc, u) => acc + u.getHardness(), 0);
        return sum / units.size();
    }
}