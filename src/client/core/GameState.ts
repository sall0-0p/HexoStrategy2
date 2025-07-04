import {Camera} from "../ui/camera/Camera";
import {NationRepository} from "../world/nation/NationRepository";
import {HexRepository} from "../world/hex/HexRepository";
import {RegionRepository} from "../world/region/RegionRepository";
import {UnitRepository} from "../systems/unit/UnitRepository";
import {UnitFlairManager} from "../ui/unit/flair/UnitFlairManager";
import {HeatmapManager} from "../ui/heatmap/HeatmapManager";
import {SelectionManager} from "../ui/unit/selection/SelectionManager";
import {ReplicatedStorage} from "@rbxts/services";
import {NationHeatmap} from "../ui/heatmap/heatmaps/NationHeatmap";
import {Bind} from "../ui/Bind";
import {MoveBind} from "../ui/unit/order/MoveBind";
import {BattleFlairManager} from "../ui/battle/flair/BattleFlairManager";

const changeNationRequest = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("SelectNation") as RemoteFunction;

export class GameState {
    private activeNationId?: string;
    private firstLoad = true;
    private binds: Bind[] = [];

    private static instance: GameState
    private constructor() {
        // Camera is loaded first, before nation is selected;
        Camera.getInstance();
    }

    public getPlayedNationId() {
        return this.activeNationId;
    }

    public switchNation(nationId: string) {
        const allowed: boolean = changeNationRequest.InvokeServer(nationId);
        if (!allowed) return;
        this.activeNationId = nationId;
        _G.activeNationId = nationId;
        this.resetAllModules();
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
        BattleFlairManager.resetInstance();
        HeatmapManager.resetInstance();
        SelectionManager.resetInstance();

        this.binds.forEach((bind) => bind.unbind());
        this.binds.clear();
    }

    private loadAllModules() {
        // Repositories
        NationRepository.getInstance();
        HexRepository.getInstance();
        RegionRepository.getInstance();
        UnitRepository.getInstance();

        // UI
        UnitFlairManager.getInstance();
        BattleFlairManager.getInstance();
        HeatmapManager.getInstance();
        SelectionManager.getInstance();

        this.binds.push(new MoveBind());

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