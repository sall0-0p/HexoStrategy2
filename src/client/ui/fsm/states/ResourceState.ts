import {UIState, UIStateType} from "../UIState";
import {Players} from "@rbxts/services";
import {HeatmapManager} from "../../heatmap/HeatmapManager";
import {NationHeatmap} from "../../heatmap/heatmaps/NationHeatmap";
import {TooltipService} from "../../generic/tooltip/TooltipService";
import {DefaultWorldTooltip} from "../../generic/tooltip/world/DefaultWorldTooltip";
import {Bind} from "../../Bind";
import {MoveBind} from "../../unit/order/MoveBind";
import {ResourceFlairManager} from "../../resource/flair/ResourceFlairManager";
import {ResourceDefs} from "../../../../shared/data/ts/ResourceDefs";
import {ResourceFlair} from "../../resource/flair/ResourceFlair";

export class ResourceUIState implements UIState {
    private player: Player = Players.LocalPlayer;
    private heatmapManager = HeatmapManager.getInstance();
    private tooltipService = TooltipService.getInstance();
    public readonly type: UIStateType = UIStateType.ResourceState;

    public onStart() {
        const gui = this.player.WaitForChild("PlayerGui");

        ResourceFlairManager.getInstance().show();
        this.heatmapManager.showHeatmap(new NationHeatmap());
        this.tooltipService.setWorldTooltip(new DefaultWorldTooltip(this.tooltipService));
    }

    public onEnd() {
        const gui = this.player.WaitForChild("PlayerGui");

        ResourceFlairManager.getInstance().clear();
        this.tooltipService.setWorldTooltip(undefined);
    }
}