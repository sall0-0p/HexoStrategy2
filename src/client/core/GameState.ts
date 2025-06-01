import {Camera} from "../ui/camera/Camera";
import {NationRepository} from "../world/nation/NationRepository";
import {HexRepository} from "../world/hex/HexRepository";
import {RegionRepository} from "../world/region/RegionRepository";
import {UnitRepository} from "../systems/unit/UnitRepository";
import {UnitFlairManager} from "../ui/unit/flair/UnitFlairManager";
import {HeatmapManager} from "../ui/heatmap/HeatmapManager";
import {SelectionManager} from "../ui/unit/selection/SelectionManager";

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
        _G.activeNationId = nationId;
        // this.resetAllModules();
        print(`Loading as ${nationId}`);
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
        UnitFlairManager.resetInstance();
        HeatmapManager.resetInstance();
        SelectionManager.resetInstance();
    }

    private loadAllModules() {
        // Repositories
        NationRepository.getInstance();
        HexRepository.getInstance();
        RegionRepository.getInstance();
        UnitRepository.getInstance();

        // UI
        UnitFlairManager.getInstance();
        HeatmapManager.getInstance();
        SelectionManager.getInstance();
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new GameState();
        }
        return this.instance;
    }
}