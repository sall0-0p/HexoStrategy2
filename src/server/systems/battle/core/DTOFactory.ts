import {PredictionEngine} from "./PredictionEngine";
import {Accountant} from "./Accountant";
import {Battle} from "../Battle";
import {Unit} from "../../unit/Unit";
import {BattleUpdate, CombatantSummaryDTO} from "../../../../shared/dto/BattleSubscription";
import {BattleSummaryDTO} from "../../../../shared/dto/BattleDTO";

export namespace DTOFactory {
    export function toSummaryDTO(battle: Battle): BattleSummaryDTO {
        const u = battle.getUnits();
        const pred = PredictionEngine.predictOutcome(battle);

        return {
            id: battle.getId(),
            location: battle.getHex().getId(),
            attackers: u.attackers.map(n => n.getId()),
            defenders: u.defenders.map(n => n.getId()),
            approximation: pred.score,
            hoursRemaining: pred.hours,
        };
    }

    export function toSubscriptionEvent(battle: Battle): BattleUpdate {
        const u = battle.getUnits();
        const pred = PredictionEngine.predictOutcome(battle);
        const maxWidth = Accountant.computeMaxWidth(battle);
        const flanks = Accountant.getFlanks(battle).size();
        const atkW = u.attackingFrontline.reduce((s, x) => s + x.getCombatWidth(), 0);
        const defW = u.defendingFrontline.reduce((s, x) => s + x.getCombatWidth(), 0);

        return {
            type: "update",
            battleId: battle.getId(),
            locationId: battle.getHex().getId(),
            forces: {
                attackers: {
                    frontline: toCombatantDTOs(battle, u.attackingFrontline),
                    reserve: toCombatantDTOs(battle, u.attackingReserve),
                },
                defenders: {
                    frontline: toCombatantDTOs(battle, u.defendingFrontline),
                    reserve: toCombatantDTOs(battle, u.defendingReserve),
                },
            },
            prediction: {
                approximation: pred.score,
                hoursRemaining: pred.hours,
            },
            width: {
                max: maxWidth,
                base: 70,
                flanks: flanks,
                attackers: atkW,
                defenders: defW,
            },
            nations: {
                attackers: [...battle.getAttackingNations()].map(n => n.getId()),
                defenders: [...battle.getDefendingNations()].map(n => n.getId()),
            },
        };
    }

    function toCombatantDTOs(battle: Battle, units: Unit[]): CombatantSummaryDTO[] {
        return units.map(u => ({
            id: u.getId(),
            attack: Accountant.getAttacks(battle, u) ?? -1,
            softAttack: u.getSoftAttack(),
            hardAttack: u.getHardAttack(),
            armor: u.getArmor(),
            piercing: u.getPiercing(),
            defence: u.getDefence(),
            breakthrough: u.getBreakthrough(),
            hardness: u.getHardness(),
        }));
    }
}