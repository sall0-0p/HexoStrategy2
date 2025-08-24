import {BattleWindow} from "./BattleWindow";
import {TooltipService} from "../../generic/tooltip/TooltipService";
import {TextComponent} from "../../generic/tooltip/components/TextComponent";
import {NationRepository} from "../../../world/nation/NationRepository";
import {BattleUpdate} from "../../../../shared/network/battle/Subscription";
import {RTWidth, RTColor} from "../../../../shared/constants/RichText";
import {EmptyComponent} from "../../generic/tooltip/components/EmptyComponent";
import {HeaderComponent} from "../../generic/tooltip/components/HeaderComponent";

export namespace BattleWindowTooltips {
    function determinePlayerSide(data: BattleUpdate) {
        if (data.nations.attackers.includes(_G.activeNationId)) {
            return "attacker"
        } else {
            return "defender"
        }
    }

    export function applyTooltips(window: BattleWindow) {
        const tooltipService = TooltipService.getInstance();
        const nationRepository = NationRepository.getInstance();
        const frame = window.getFrame();
        const progressCont = frame.WaitForChild("ProgressContainer")

        // Flags
        const attackingFlag = progressCont.WaitForChild("AttackersFlag") as Frame;
        const defendersFlag = progressCont.WaitForChild("DefendersFlag") as Frame;

        tooltipService.bind(attackingFlag, [
            { class: TextComponent, get: () => {
                const payload = window.getLatestPayload();
                if (!payload) return { text: "???" };
                const nation = nationRepository.getById(payload.nations.attackers[0]);
                if (!nation) return { text: "??? "};

                return { text: nation.getName() };
            }}
        ])

        tooltipService.bind(defendersFlag, [
            { class: TextComponent, get: () => {
                const payload = window.getLatestPayload();
                if (!payload) return { text: "???" };
                const nation = nationRepository.getById(payload.nations.defenders[0]);
                if (!nation) return { text: "???" };

                return { text: nation.getName() };
            }}
        ])

        // Progress Bar
        let playerSide: "attacker" | "defender" | undefined;
        const progress = progressCont.WaitForChild("Progress") as Frame;
        tooltipService.bind(progress, [
            { class: HeaderComponent, get: () => {
                const payload = window.getLatestPayload();
                if (!payload) return { text: "???" };

                const n = payload.prediction.approximation;
                if (math.abs(n) < 0.2) {
                    return { text: `<font width="${RTWidth.Bold}">The battle outcome is yet unknown</font>` };
                }

                const side = playerSide ??= determinePlayerSide(payload);
                const isAttacker = side === "attacker";
                const winText  = `<font color="${RTColor.Green}">Our forces are winning!</font>`;
                const loseText = `<font color="${RTColor.Red}">Our forces are losing :(</font>`;

                const weWin = isAttacker ? (n > 0) : (n < 0);
                return { text: weWin ? winText : loseText };
            }},
            { class: TextComponent, get: () => {
                const payload = window.getLatestPayload();
                if (!payload) return { text: "???" };
                const remaining = payload.prediction.hoursRemaining;

                if (remaining < 24) {
                    return { text: `We approximate that battle will end in less than one day` };
                } else {
                    return { text: `We approximate that battle will end in ${math.ceil(remaining / 24)} days`};
                }
            }},
        ])

        // Combat Width
        const attackersCW = progressCont.WaitForChild("AttackersCombatWidth") as Frame;
        const defendersCW = progressCont.WaitForChild("DefendersCombatWidth") as Frame;
        tooltipService.bind(attackersCW, [
            { class: TextComponent, get: () => ({ text: "Used combat width" })},
        ])
        tooltipService.bind(defendersCW, [
            { class: TextComponent, get: () => ({ text: "Used combat width" })},
        ])

        const totalCW = progressCont.WaitForChild("TotalCombatWidth") as Frame;
        tooltipService.bind(totalCW, [
            { class: HeaderComponent, get: () =>
                    ({ text: "Combat Width"})},
            { class: TextComponent, get: () =>
                    ({ text: "Determines how many units from each side can join the battle. It can be increased by attacking from multiple directions."})},
            { class: EmptyComponent },
            { class: HeaderComponent, get: () => ({ text: "Terrain"})},
            { class: TextComponent, get: () => {
                const payload = window.getLatestPayload();
                if (!payload) return { text: "???" };

                return { text: `Combat width: <font color="${RTColor.Important}">${payload.width.base}</font>`};
            }},
            { class: TextComponent, get: () => {
                const payload = window.getLatestPayload();
                if (!payload) return { text: "???" };

                return { text: `Combat width per additional direction (${payload.width.flanks}): <font color="${RTColor.Important}">+${math.round(payload.width.base/2)}</font>`};
            }},
        ])

        // Reserves Tooltip
    }
}