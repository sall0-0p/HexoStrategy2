import {Heatmap, HeatmapGroup} from "../Heatmap";
import {Hex} from "../../../world/hex/Hex";
import {HexDispatcher, Update} from "../../../world/hex/HexDispatcher";
import {Connection} from "../../../../shared/classes/Signal";
import {HeatmapManager} from "../HeatmapManager";
import {GameState} from "../../../core/GameState";

const hexDispatcher = HexDispatcher.getInstance();
export class MeHeatmap implements Heatmap {
    private name = "MeNation";
    private updateConnection?: Connection;

    public getGroup(hex: Hex) {
        const owner = hex.getOwner();

        if (owner && owner.getId() === GameState.getInstance().getPlayedNationId()) {
            const color = owner.getColor();
            return {
                name: owner.getName(),
                isHighlighted: true,
                outlineColor: Color3.fromRGB(0, 255, 0),
                outlineTransparency: 0.2,
                fillColor: Color3.fromRGB(0, 255, 0),
                fillTransparency: 0.5,
                depthMode: Enum.HighlightDepthMode.Occluded,
            } as HeatmapGroup
        } else if (owner) {
            const color = owner.getColor();
            return {
                name: owner.getName(),
                isHighlighted: true,
                outlineColor: Color3.fromRGB(255, 0, 0),
                outlineTransparency: 0.2,
                fillColor: Color3.fromRGB(255, 0, 0),
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