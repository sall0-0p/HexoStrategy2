import {UIState, UIStateType} from "../UIState";
import {Building} from "../../../../shared/data/ts/BuildingDefs";
import {HeatmapManager} from "../../heatmap/HeatmapManager";
import {HexConstructionHeatmap} from "../../heatmap/heatmaps/HexConstructionHeatmap";
import {ConstructionFlairManager} from "../../construction/flair/ConstructionFlairManager";
import {BuildBind} from "../../construction/BuildBind";
import {Players} from "@rbxts/services";
import {Bind} from "../../Bind";
import {TooltipService} from "../../generic/tooltip/TooltipService";
import {BaseBuildTooltip} from "../../generic/tooltip/world/BaseBuildTooltip";

export class HexConstructionState implements UIState {
    private player: Player = Players.LocalPlayer;
    private playerGui: PlayerGui = this.player.WaitForChild("PlayerGui") as PlayerGui;
    private binds: Bind[] = [];
    private tooltipService = TooltipService.getInstance();
    public readonly type: UIStateType = UIStateType.HexConstruction;

    public constructor(public readonly building: Building) {

    }

    onStart(previous?: UIState) {
        HeatmapManager.getInstance().showHeatmap(new HexConstructionHeatmap(this.building));
        this.tooltipService.setWorldTooltip(new BaseBuildTooltip(this.tooltipService, this.building));
        ConstructionFlairManager.getInstance().show(this.building);
        this.binds.push(new BuildBind(this.building));
    }

    onEnd(nxt?: UIState) {
        ConstructionFlairManager.getInstance().clear();
        this.tooltipService.setWorldTooltip(undefined);
        this.binds.forEach((b) => b.unbind());
        this.binds.clear();
    }
}