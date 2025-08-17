import {UIState, UIStateType} from "../UIState";
import {Players} from "@rbxts/services";
import {HeatmapManager} from "../../heatmap/HeatmapManager";
import {NationHeatmap} from "../../heatmap/heatmaps/NationHeatmap";
import {TooltipService} from "../../generic/tooltip/TooltipService";
import {DefaultWorldTooltip} from "../../generic/tooltip/world/DefaultWorldTooltip";
import {Bind} from "../../Bind";
import {MoveBind} from "../../unit/order/MoveBind";

export class NormalUIState implements UIState {
    private player: Player = Players.LocalPlayer;
    private heatmapManager = HeatmapManager.getInstance();
    private tooltipService = TooltipService.getInstance();
    private binds: Bind[] = [];
    public readonly type: UIStateType = UIStateType.Normal;

    public onStart() {
        const gui = this.player.WaitForChild("PlayerGui");
        const flairs = gui.WaitForChild("Flairs") as Folder;
        const windows = gui.WaitForChild("Windows") as Folder;

        (flairs.WaitForChild("Battles") as ScreenGui).Enabled = true;
        (flairs.WaitForChild("Units") as ScreenGui).Enabled = true;

        this.heatmapManager.showHeatmap(new NationHeatmap());
        this.tooltipService.setWorldFetcher(DefaultWorldTooltip.get);

        this.binds.push(new MoveBind());
    }

    public onEnd() {
        const gui = this.player.WaitForChild("PlayerGui");
        const flairs = gui.WaitForChild("Flairs") as Folder;
        const windows = gui.WaitForChild("Windows") as Folder;

        (flairs.WaitForChild("Battles") as ScreenGui).Enabled = false;
        (flairs.WaitForChild("Units") as ScreenGui).Enabled = false;

        this.binds.forEach((b) => b.unbind());
        this.tooltipService.setWorldFetcher(undefined);
        this.binds.clear();
    }
}