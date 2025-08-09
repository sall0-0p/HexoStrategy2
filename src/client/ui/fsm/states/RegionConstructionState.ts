import {UIState, UIStateType} from "../UIState";
import {Building} from "../../../../shared/data/ts/BuildingDefs";
import {Players} from "@rbxts/services";
import {HeatmapManager} from "../../heatmap/HeatmapManager";
import {RegionConstructionHeatmap} from "../../heatmap/heatmaps/RegionConstructionHeatmap";
import {Bind} from "../../Bind";
import {BuildBind} from "../../construction/BuildBind";

export class RegionConstructionState implements UIState {
    private player: Player = Players.LocalPlayer;
    private playerGui: PlayerGui = this.player.WaitForChild("PlayerGui") as PlayerGui;
    private binds: Bind[] = [];
    public readonly type: UIStateType = UIStateType.RegionConstruction;

    constructor(private readonly building: Building) {}

    onStart(previous?: UIState) {
        (this.playerGui.WaitForChild("Battles") as ScreenGui).Enabled = false;
        (this.playerGui.WaitForChild("Flairs") as ScreenGui).Enabled = false;

        HeatmapManager.getInstance().showHeatmap(new RegionConstructionHeatmap(this.building));
        this.binds.push(new BuildBind(this.building));
    }

    onEnd(nxt?: UIState) {
        this.binds.forEach((b) => b.unbind());
        this.binds.clear();
    }
}