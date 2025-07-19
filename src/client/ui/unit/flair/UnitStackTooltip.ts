import {UnitStack} from "./UnitStack";
import {TooltipService} from "../../generic/tooltip/TooltipService";
import {TextComponent} from "../../generic/tooltip/components/TextComponent";
import {SeparatorComponent} from "../../generic/tooltip/components/SeparatorComponent";
import {RTColor} from "../../../../shared/config/RichText";
import {TextUtils} from "../../../../shared/classes/TextUtils";
import {TooltipDelay} from "../../../../shared/config/TooltipDelay";
import {TemplateRequester} from "../../../systems/unit/template/TemplateRequester";

export namespace UnitStackTooltip {
    const font = `font color="${RTColor.Important}"`

    function getTitle(stack: UnitStack): { text: string } {
        const units = stack.getUnits();

        let name: string;
        if (units.size() > 1) {
            const template = TemplateRequester.getTemplate(units[0].getTemplateId(), true);
            const templateName  = template?.name ?? "???"
            name = `<${font}>${units.size()}</font> of <${font}>${templateName}</font>`
        } else if (units.size() === 1) {
            name = `<${font}>${units[0].getName()}</font>`
        } else {
            return { text: "???" }
        }

        const unit = units[0];
        const nation = unit.getOwner();
        const text = name + ` (<${font}>${nation.getName()}</font>)`;

        return { text };
    }

    function getOrganisation(stack: UnitStack): { text: string } {
        const units = stack.getUnits();

        let text: string;
        if (units.size() > 1) {
            const org = math.round(units.reduce((sum, u) =>
                sum + u.getOrganisation(), 0) / units.size());
            const maxOrg = math.round(units.reduce((sum, u) =>
                sum + u.getMaxOrg(), 0) / units.size());
            const percent = math.round((org / maxOrg) * 100);

            text = `Average Organisation: <${font}>${percent}%</font>`;
        } else if (units.size() === 1) {
            const unit = units[0];
            const org = TextUtils.trimDecimals(unit.getOrganisation(), 1);
            const maxOrg = TextUtils.trimDecimals(unit.getMaxOrg(), 1)
            text = `Organisation: <${font}>${org}</font>/<${font}>${maxOrg}</font>`;
        } else {
            text = "???"
        }

        return { text }
    }

    function getStrength(stack: UnitStack): { text: string } {
        const units = stack.getUnits();

        let text: string;
        if (units.size() > 1) {
            const hp = math.round(units.reduce((sum, u) =>
                sum + u.getHp(), 0) / units.size());
            const maxHp = math.round(units.reduce((sum, u) =>
                sum + u.getMaxHp(), 0) / units.size());
            const percent = math.round((hp / maxHp) * 100);

            text = `Average Strength: <${font}>${percent}%</font>`;
        } else if (units.size() === 1) {
            const unit = units[0];
            const hp = TextUtils.trimDecimals(unit.getHp(), 1);
            const maxHp = TextUtils.trimDecimals(unit.getMaxHp(), 1);
            text = `Strength: <${font}>${hp}</font>/<${font}>${maxHp}</font>`;
        } else {
            text = "???"
        }

        return { text }
    }

    export function add(stack: UnitStack) {
        const tooltipService = TooltipService.getInstance();
        const flair = stack.getFlair();
        const frame = flair.getFrame();

        tooltipService.bind(frame, [
            { class: TextComponent, get: () => getTitle(stack) },
            { class: SeparatorComponent, delay: TooltipDelay.MoreInfo },
            { class: TextComponent, delay: TooltipDelay.MoreInfo, get: () => getOrganisation(stack) },
            { class: TextComponent, delay: TooltipDelay.MoreInfo, get: () => getStrength(stack) },
        ])
    }
}