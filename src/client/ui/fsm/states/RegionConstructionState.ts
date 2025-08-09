import {UIState, UIStateType} from "../UIState";
import {Building} from "../../../../shared/data/ts/BuildingDefs";
import {Players} from "@rbxts/services";
import {HeatmapManager} from "../../heatmap/HeatmapManager";
import {RegionConstructionHeatmap} from "../../heatmap/heatmaps/RegionConstructionHeatmap";

export class RegionConstructionState implements UIState {
    private player: Player = Players.LocalPlayer;
    private playerGui: PlayerGui = this.player.WaitForChild("PlayerGui") as PlayerGui;
    public readonly type: UIStateType = UIStateType.RegionConstruction;

    constructor(private readonly building: Building) {

    }

    onStart(previous?: UIState) {
        (this.playerGui.WaitForChild("Battles") as ScreenGui).Enabled = false;
        (this.playerGui.WaitForChild("Flairs") as ScreenGui).Enabled = false;

        HeatmapManager.getInstance().showHeatmap(new RegionConstructionHeatmap(this.building));
    }
}