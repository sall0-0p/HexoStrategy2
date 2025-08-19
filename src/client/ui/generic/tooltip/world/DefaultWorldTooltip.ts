import {TooltipEntry} from "../Tooltip";
import {TextComponent} from "../components/TextComponent";
import {Hex} from "../../../../world/hex/Hex";
import {RTColor} from "../../../../../shared/config/RichText";
import {SelectionManager} from "../../../unit/selection/SelectionManager";
import {SeparatorComponent} from "../components/SeparatorComponent";
import {EmptyComponent} from "../components/EmptyComponent";
import {TooltipDelay} from "../../../../../shared/config/TooltipDelay";
import {WorldTooltip} from "./WorldTooltip";
import {TooltipService} from "../TooltipService";

export class DefaultWorldTooltip implements WorldTooltip {
    public constructor(private tooltipService: TooltipService) {};

    private font = `font color="${RTColor.Important}"`;
    private getTitle(hex: Hex): { text: string } {
        const region = hex.getRegion();
        if (!region) return { text: "???" };
        return { text: `A hex in <${this.font}>${region.getName()}</font> (<${this.font}>${hex.getId()}</font>)` }
    }

    private getOwner(hex: Hex): { text: string } {
        const owner = hex.getOwner();
        if (!owner) return { text: `Owner: <${this.font}>Neutral</font>}`}
        return { text: `Owner: <${this.font}>${owner?.getName() ?? "Neutral"}</font>`}
    }

    public get(): TooltipEntry<any>[] | undefined {
        const selectionManager = SelectionManager.getInstance();

        return [
            { class: TextComponent, get: () => {
                const hex = this.tooltipService.getHexAtMousePosition();
                if (!hex) {
                    this.tooltipService.hideWorld();
                    return {text: "???"};
                }
                return this.getTitle(hex);
            }},
            { class: TextComponent, get: () => {
                const hex = this.tooltipService.getHexAtMousePosition();
                if (!hex) {
                    this.tooltipService.hideWorld();
                    return {text: "???"};
                }
                return this.getOwner(hex);
            }},
            { class: EmptyComponent, if: () => selectionManager.getSelectedUnits().size() > 0},
            { class: TextComponent, if: () => selectionManager.getSelectedUnits().size() > 0,
                get: () => ({ text: `Units Selected: <${this.font}>${selectionManager.getSelectedUnits().size()}</font>`})},
            { class: SeparatorComponent, delay: TooltipDelay.Controls, if: () => selectionManager.getSelectedUnits().size() > 0 },
            { class: TextComponent, delay: TooltipDelay.Controls, if: () => selectionManager.getSelectedUnits().size() > 0,
                get: () => ({ text: `<font color="${RTColor.Green}">Right-Click</font> to order units to <${this.font}>move here</font>`})},
        ]
    }
}