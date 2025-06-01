import {GameState} from "./core/GameState";
import {HeatmapManager} from "./ui/heatmap/HeatmapManager";
import {MoveBind} from "./ui/unit/order/MoveBind";
import {NationHeatmap} from "./ui/heatmap/heatmaps/NationHeatmap";

declare global {
    interface _G {
        activeNationId: string,
    }
}

print("Getting GameState")
const gameState = GameState.getInstance();
print("Selecting PNL")
gameState.switchNation("PNL");
const heatmapManager2 = HeatmapManager.getInstance();
heatmapManager2.showHeatmap(new NationHeatmap());

new MoveBind();