import {Heatmap, HeatmapGroup} from "../Heatmap";
import {Hex} from "../../hex/Hex";
import {HexDispatcher, Update} from "../../hex/HexDispatcher";
import {Connection} from "../../../../shared/classes/Signal";
import {HeatmapManager} from "../HeatmapManager";

const hexDispatcher = HexDispatcher.getInstance();
export class NationHeatmap implements Heatmap {
    private name = "Nations";
    private updateConnection?: Connection;

    public getGroup(hex: Hex) {
        const owner = hex.getOwner();

        if (owner) {
            const color = owner.getColor();
            return {
                name: owner.getName(),
                isHighlighted: true,
                outlineColor: color,
                outlineTransparency: 0.8,
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
        const signal = hexDispatcher.getUpdateSignal();

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