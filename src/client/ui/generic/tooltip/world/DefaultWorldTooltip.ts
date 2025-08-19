import {TooltipEntry} from "../Tooltip";
import {CollectionService, UserInputService, Workspace} from "@rbxts/services";
import {TextComponent} from "../components/TextComponent";
import {HexRepository} from "../../../../world/hex/HexRepository";
import {Hex} from "../../../../world/hex/Hex";
import {RTColor} from "../../../../../shared/config/RichText";
import {SelectionManager} from "../../../unit/selection/SelectionManager";
import {SeparatorComponent} from "../components/SeparatorComponent";
import {EmptyComponent} from "../components/EmptyComponent";
import {TooltipDelay} from "../../../../../shared/config/TooltipDelay";
import {TooltipService} from "../TooltipService";

export namespace DefaultWorldTooltip {
    const font = `font color="${RTColor.Important}"`

    function getTitle(hex: Hex): { text: string } {
        const region = hex.getRegion();
        if (!region) return { text: "???" };
        return { text: `A hex in <${font}>${region.getName()}</font> (<${font}>${hex.getId()}</font>)` }
    }

    function getOwner(hex: Hex): { text: string } {
        const owner = hex.getOwner();
        // if (!owner) return { text: `Owner: <${font}>Neutral</font>}`}
        return { text: `Owner: <${font}>${owner?.getName() ?? "Neutral"}</font>`}
    }

    export function get(tooltipService: TooltipService): TooltipEntry<any>[] | undefined {
        const selectionManager = SelectionManager.getInstance();

        return [
            { class: TextComponent, get: () => {
                const hex = tooltipService.getHexAtMousePosition();
                if (!hex) {
                    tooltipService.hideWorld();
                    return {text: "???"};
                }
                return getTitle(hex);
            }},
            { class: TextComponent, get: () => {
                const hex = tooltipService.getHexAtMousePosition();
                if (!hex) {
                    tooltipService.hideWorld();
                    return {text: "???"};
                }
                return getOwner(hex);
            }},
            { class: EmptyComponent, if: () => selectionManager.getSelectedUnits().size() > 0},
            { class: TextComponent, if: () => selectionManager.getSelectedUnits().size() > 0,
                get: () => ({ text: `Units Selected: <${font}>${selectionManager.getSelectedUnits().size()}</font>`})},
            { class: SeparatorComponent, delay: TooltipDelay.Controls, if: () => selectionManager.getSelectedUnits().size() > 0 },
            { class: TextComponent, delay: TooltipDelay.Controls, if: () => selectionManager.getSelectedUnits().size() > 0,
                get: () => ({ text: `<font color="${RTColor.Green}">Right-Click</font> to order units to <${font}>move here</font>`})},
        ]
    }
}