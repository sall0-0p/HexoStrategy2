import {Heatmap, HeatmapGroup} from "../Heatmap";
import {Hex} from "../../hex/Hex";

export class NationHeatmap implements Heatmap {
    private name = "Nations";

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
}