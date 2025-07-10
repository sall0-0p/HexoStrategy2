import {Unit} from "../../unit/Unit";
import {Battle} from "../Battle";
import {Accountant} from "./Accountant";

export namespace ReserveManager {
    // Reserves
    function tickUnitInReserve(battle: Battle, unit: Unit, isDefender: boolean) {
        const units = battle.getUnits();
        const maxWidth = Accountant.computeMaxWidth(battle);
        let combatWidth = 0;
        if (isDefender) {
            units.defendingFrontline.forEach((u) => combatWidth += u.getCombatWidth());
        } else {
            units.attackingFrontline.forEach((u) => combatWidth += u.getCombatWidth());
        }

        const potentialWidth = combatWidth + unit.getCombatWidth();
        if (potentialWidth > maxWidth * 1.33) return;
        const overflow = potentialWidth > maxWidth;

        const roll = math.random(1, 100) * 0.01;
        const chance = 0.02 * (1 + unit.getInitiative()) * (overflow ? 0.5 : 1);
        if (roll < chance) {
            if (isDefender) {
                units.defendingReserve.remove(units.defendingReserve.indexOf(unit));
                units.defendingFrontline.push(unit);
            } else {
                units.attackingReserve.remove(units.attackingReserve.indexOf(unit));
                units.attackingFrontline.push(unit);
            }
        }
    }

    export function tickReserves(battle: Battle) {
        const units = battle.getUnits();

        units.defendingReserve.forEach((u) => tickUnitInReserve(battle, u, true));
        units.attackingReserve.forEach((u) => tickUnitInReserve(battle, u, false));
    }

    export function selectUnits(battle: Battle, reserves: Unit[], frontline: Unit[], powers: Map<Unit, number>) {
        const baseWidth = Accountant.computeMaxWidth(battle);
        const overlapLimit = baseWidth * 1.33;
        let currentWidth = frontline.reduce((sum, u) => sum + u.getCombatWidth(), 0);

        while (currentWidth < baseWidth) {
            let bestUnder: Unit | undefined;
            let bestOver: Unit | undefined;
            let bestUnderPower = -math.huge;
            let bestOverPower = -math.huge;

            reserves.forEach((unit) => {
                const width = unit.getCombatWidth();
                const newWidth = currentWidth + width;
                const power = powers.get(unit) ?? 0;

                if (newWidth <= baseWidth && power > bestUnderPower) {
                    bestUnder = unit;
                    bestUnderPower = power;
                }

                if (newWidth > baseWidth && newWidth <= overlapLimit && power > bestOverPower) {
                    bestOver = unit;
                    bestOverPower = power;
                }
            })

            const pick = bestUnder ?? bestOver;
            if (!pick) break;

            frontline.push(pick);
            const index = reserves.indexOf(pick);
            reserves.remove(index);

            currentWidth += pick.getCombatWidth();
        }
    }

    // Defences
    const defences = new Map<Battle, Map<Unit, number>>;

    export function getDefences(battle: Battle, unit: Unit) {
        return defences.get(battle)?.get(unit);
    }

    export function resetDefences(battle: Battle) {
        defences.get(battle)?.clear();
    }

    export function buildDefences(battle: Battle, units: Unit[], isDefender: boolean) {
        let map = defences.get(battle);
        if (!map) {
            map = new Map<Unit, number>();
            defences.set(battle, map);
        }

        const currentWidth = units.reduce((sum, u) => sum + u.getCombatWidth(), 0);
        const maxWidth = Accountant.computeMaxWidth(battle);
        const over = maxWidth - currentWidth;
        const penalty = 1 + (-1 * over / maxWidth);

        units.forEach(unit => {
            const stat = isDefender ? unit.getDefence() : unit.getBreakthrough();
            const base = stat / 10;
            const cwAdjusted = over < 0
                ? base
                : base * penalty;

            map!.set(unit, math.round(cwAdjusted));
        });
    }

    // Losers
    export function disengage(battle: Battle) {
        const units = battle.getUnits();
        units.defendingFrontline.forEach((unit) => {
            if (unit.getOrganisation() / unit.getMaxOrganisation() < 0.05) {
                unit.retreat();
                battle.removeUnit(unit);
            }
        })

        units.attackingFrontline.forEach((unit) => {
            if (unit.getOrganisation() / unit.getMaxOrganisation() < 0.05) {
                unit.getCurrentMovemementOrder()?.cancel();
                battle.removeUnit(unit);
            }
        })
    }
}