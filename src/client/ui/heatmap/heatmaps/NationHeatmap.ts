import {Heatmap, HeatmapGroup} from "../Heatmap";
import {Hex} from "../../../world/hex/Hex";
import {HexDispatcher, Update} from "../../../world/hex/HexDispatcher";
import {Connection} from "../../../../shared/classes/Signal";
import {HeatmapManager} from "../HeatmapManager";

export class NationHeatmap implements Heatmap {
    private name = "Nations";
    private updateConnection?: Connection;

    private hexDispatcher = HexDispatcher.getInstance();

    public getGroup(hex: Hex) {
        const owner = hex.getOwner();

        const color = owner?.getColor() || Color3.fromRGB(255, 255, 255);
        const name = owner?.getName() || "Unassigned";
        return {
            name,
            isHighlighted: true,
            outlineColor: color,
            outlineTransparency: 0.2,
            fillColor: color,
            fillTransparency: 0.4,
            depthMode: Enum.HighlightDepthMode.Occluded,
        } as HeatmapGroup
    }

    public getName() {
        return this.name;
    }

    public onEnable() {
        const heatmapManager = HeatmapManager.getInstance();
        const signal = this.hexDispatcher.getUpdateSignal();

        this.updateConnection = signal.connect((updates: Update[]) => {
            updates.forEach((update) => {
                // check if value updated is owner
                if (update.key === "owner") {
                    heatmapManager.updateHex(update.hex);
                }
            })
        })
    }
}