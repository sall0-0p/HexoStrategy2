import {HexRepository} from "./classes/hex/HexRepository";
import {NationRepository} from "./classes/nation/NationRepository";
import {HeatmapManager} from "./classes/heatmap/HeatmapManager";
import {NationHeatmap} from "./classes/heatmap/heatmaps/NationHeatmap";
import {UnitRepository} from "./classes/unit/UnitRepository";
import {UnitFlairManager} from "./classes/unit/flair/UnitFlairManager";
import {Camera} from "./classes/camera/Camera";

const camera = Camera.getInstance();
const nationRepository = NationRepository.getInstance();
const hexRepository = HexRepository.getInstance();
const unitRepository = UnitRepository.getInstance();
const unitFlairManager = UnitFlairManager.getInstance();
hexRepository.getLoadedSignal().wait();
const heatmapManager = HeatmapManager.getInstance();
heatmapManager.showHeatmap(new NationHeatmap());