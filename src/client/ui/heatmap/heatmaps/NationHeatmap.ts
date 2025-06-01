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

        if (owner) {
            const color = owner.getColor();
            return {
                name: owner.getName(),
                isHighlighted: true,
                outlineColor: color,
                outlineTransparency: 0.2,
                fillColor: color,
                fillTransparency: 0.5,
                depthMode: Enum.HighlightDepthMode.Occluded,
            } as HeatmapGroup
        } else {
            return {
                name: "Unassigned",
                isHighlighted: false,
            } as HeatmapGroup
        }
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
            heatmapManager.updateHighlights();
        })
    }
}