import {UIState} from "../State";
import {Players} from "@rbxts/services";
import {HeatmapManager} from "../../heatmap/HeatmapManager";
import {NationHeatmap} from "../../heatmap/heatmaps/NationHeatmap";
import {TooltipService} from "../../generic/tooltip/TooltipService";
import {DefaultWorldTooltip} from "../../generic/tooltip/world/DefaultWorldTooltip";

export class NormalUIState implements UIState {
    private player: Player = Players.LocalPlayer;
    private heatmapManager = HeatmapManager.getInstance();
    private tooltipService = TooltipService.getInstance();

    public onStart() {
        const gui = this.player.WaitForChild("PlayerGui");
        const windows = gui.WaitForChild("Windows") as Folder;

        (gui.WaitForChild("Battles") as ScreenGui).Enabled = true;
        (gui.WaitForChild("Flairs") as ScreenGui).Enabled = true;

        this.heatmapManager.showHeatmap(new NationHeatmap());
        this.tooltipService.setWorldFetcher(DefaultWorldTooltip.get);
    }

    public onEnd() {
        const gui = this.player.WaitForChild("PlayerGui");
        const windows = gui.WaitForChild("Windows") as Folder;

        (gui.WaitForChild("Battles") as ScreenGui).Enabled = false;
        (gui.WaitForChild("Flairs") as ScreenGui).Enabled = false;
    }
}