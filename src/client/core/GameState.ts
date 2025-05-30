import {Camera} from "../ui/camera/Camera";
import {NationRepository} from "../world/nation/NationRepository";
import {HexRepository} from "../world/hex/HexRepository";
import {RegionRepository} from "../world/region/RegionRepository";
import {UnitRepository} from "../systems/unit/UnitRepository";
import {UnitFlairManager} from "../systems/unit/flair/UnitFlairManager";
import {HeatmapManager} from "../ui/heatmap/HeatmapManager";
import {SelectionManager} from "../ui/selection/SelectionManager";
import {NationHeatmap} from "../ui/heatmap/heatmaps/NationHeatmap";

export class GameState {
    private activeNationId?: string;
    private firstLoad = true;

    private static instance: GameState
    private constructor() {
        // Camera is loaded first, before nation is selected;
        Camera.getInstance();
    }

    public getPlayedNationId() {
        return this.activeNationId;
    }

    public switchNation(nationId: string) {
        this.activeNationId = nationId;
        // this.resetAllModules();
        this.loadAllModules();
    }

    private resetAllModules() {
        if (this.firstLoad) {
            this.firstLoad = false;
            return;
        }
        // Repositories
        NationRepository.resetInstance();
        HexRepository.resetInstance();
        RegionRepository.resetInstance();
        UnitRepository.resetInstance();

        // UI
    }

    private loadAllModules() {
        // Repositories
        NationRepository.getInstance();
        HexRepository.getInstance()
            .getLoadedSignal().wait();
        RegionRepository.getInstance();
        UnitRepository.getInstance();

        // UI
        UnitFlairManager.getInstance();
        HeatmapManager.getInstance();
        SelectionManager.getInstance();

        // We also toggle the Countries heatmap
        const heatmapManager = HeatmapManager.getInstance();
        heatmapManager.showHeatmap(new NationHeatmap());
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new GameState();
        }
        return this.instance;
    }
}