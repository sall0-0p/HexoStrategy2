import {TooltipEntry} from "../Tooltip";
import {UserInputService, Workspace} from "@rbxts/services";
import {TextComponent} from "../components/TextComponent";
import {HexRepository} from "../../../../world/hex/HexRepository";
import {Hex} from "../../../../world/hex/Hex";
import {RTColor} from "../../../../../shared/classes/RichText";
import {SelectionManager} from "../../../unit/selection/SelectionManager";
import {SeparatorComponent} from "../components/SeparatorComponent";
import {EmptyComponent} from "../components/EmptyComponent";
import {TooltipDelay} from "../../../../../shared/config/TooltipDelay";

export namespace DefaultWorldTooltip {
    const font = `font color="${RTColor.Important}"`

    function raycastHex() {
        const camera = Workspace.CurrentCamera;
        if (!camera) return;

        const mouse = UserInputService.GetMouseLocation();
        const unitRay = camera.ViewportPointToRay(mouse.X, mouse.Y);
        const params = new RaycastParams();
        params.FilterType = Enum.RaycastFilterType.Include;
        params.FilterDescendantsInstances = [ Workspace.WaitForChild("Heatmaps"), Workspace.WaitForChild("Overlays") ];

        const hit = Workspace.Raycast(unitRay.Origin, unitRay.Direction.mul(1000), params);
        if (!hit || !hit.Instance) return;
        const id = hit.Instance.FindFirstAncestorOfClass("Model")?.Name
        if (!id) return;

        const repo = HexRepository.getInstance();
        return repo.getById(id);
    }

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

    export function get(): TooltipEntry<any>[] | undefined {
        const selectionManager = SelectionManager.getInstance();

        return [
            { class: TextComponent, get: () => {
                const hex = raycastHex();
                if (!hex) return { text: "???" };
                return getTitle(hex);
            }},
            { class: TextComponent, get: () => {
                const hex = raycastHex();
                if (!hex) return { text: "???" };
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