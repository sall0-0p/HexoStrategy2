import {GameState} from "./core/GameState";
import {HeatmapManager} from "./ui/heatmap/HeatmapManager";
import {MoveBind} from "./ui/unit/order/MoveBind";
import {NationHeatmap} from "./ui/heatmap/heatmaps/NationHeatmap";

const gameState = GameState.getInstance()
gameState.switchNation("PNL");
const heatmapManager2 = HeatmapManager.getInstance();
heatmapManager2.showHeatmap(new NationHeatmap());

new MoveBind();