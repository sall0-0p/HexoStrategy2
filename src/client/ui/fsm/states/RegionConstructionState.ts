import {UIState, UIStateType} from "../UIState";
import {Building, BuildingDefs} from "../../../../shared/data/ts/BuildingDefs";
import {Players} from "@rbxts/services";
import {HeatmapManager} from "../../heatmap/HeatmapManager";
import {RegionConstructionHeatmap} from "../../heatmap/heatmaps/RegionConstructionHeatmap";
import {Bind} from "../../Bind";
import {BuildBind} from "../../construction/BuildBind";
import {ConstructionFlairManager} from "../../construction/flair/ConstructionFlairManager";
import {BuildingType} from "../../../../shared/classes/BuildingDef";
import {BaseBuildTooltip} from "../../generic/tooltip/world/BaseBuildTooltip";
import {TooltipService} from "../../generic/tooltip/TooltipService";
import {SharedBuildTooltip} from "../../generic/tooltip/world/SharedBuildTooltip";

export class RegionConstructionState implements UIState {
    private player: Player = Players.LocalPlayer;
    private playerGui: PlayerGui = this.player.WaitForChild("PlayerGui") as PlayerGui;
    private binds: Bind[] = [];
    private tooltipService = TooltipService.getInstance();
    public readonly type: UIStateType = UIStateType.RegionConstruction;

    constructor(public readonly building: Building) {}

    onStart(previous?: UIState) {
        HeatmapManager.getInstance().showHeatmap(new RegionConstructionHeatmap(this.building));
        ConstructionFlairManager.getInstance().show(this.building);
        this.binds.push(new BuildBind(this.building));

        const def = BuildingDefs[this.building];
        if (def.type === BuildingType.Region || def.type === BuildingType.Hex) {
            this.tooltipService.setWorldTooltip(new BaseBuildTooltip(this.tooltipService, this.building));
        } else {
            this.tooltipService.setWorldTooltip(new SharedBuildTooltip(this.tooltipService, this.building));
        }

    }

    onEnd(nxt?: UIState) {
        ConstructionFlairManager.getInstance().clear();
        this.tooltipService.setWorldTooltip(undefined);
        this.binds.forEach((b) => b.unbind());
        this.binds.clear();
    }
}