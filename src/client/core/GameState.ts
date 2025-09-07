import {Camera} from "../ui/camera/Camera";
import {NationRepository} from "../world/nation/NationRepository";
import {HexRepository} from "../world/hex/HexRepository";
import {RegionRepository} from "../world/region/RegionRepository";
import {UnitRepository} from "../systems/unit/UnitRepository";
import {UnitFlairManager} from "../ui/unit/flair/UnitFlairManager";
import {HeatmapManager} from "../ui/heatmap/HeatmapManager";
import {SelectionManager} from "../ui/unit/selection/SelectionManager";
import {ReplicatedStorage, StarterGui} from "@rbxts/services";
import {BattleFlairManager} from "../ui/battle/flair/BattleFlairManager";
import {BattleWindowManager} from "../ui/battle/screen/BattleWindowManager";
import {TooltipService} from "../ui/generic/tooltip/TooltipService";
import {UIStateMachine} from "../ui/fsm/UIStateMachine";
import {NormalUIState} from "../ui/fsm/states/NormalState";
import {ModifierRouter} from "../systems/modifier/ModifierRouter";
import {EquipmentTypeRepository} from "../systems/equipment/type/EquipmentTypeRepository";

const changeNationRequest = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("SelectNation") as RemoteFunction;

export class GameState {
    private activeNationId?: string;
    private firstLoad = true;

    private static instance: GameState
    private constructor() {
        Camera.getInstance();

        StarterGui.SetCore("TopbarEnabled", false);
        StarterGui.SetCoreGuiEnabled("All", false);
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
        ModifierRouter.resetInstance();
        // TODO: Add EquipmentTypeRepository resets, or probably I do not need them, idk.

        // UI
        UnitFlairManager.resetInstance();
        BattleFlairManager.resetInstance();
        BattleWindowManager.resetInstance();
        HeatmapManager.resetInstance();
        SelectionManager.resetInstance();
        TooltipService.resetInstance();
    }

    private loadAllModules() {
        // Repositories
        NationRepository.getInstance();
        HexRepository.getInstance();
        RegionRepository.getInstance();
        EquipmentTypeRepository.getInstance(NationRepository.getInstance());
        UnitRepository.getInstance();
        ModifierRouter.getInstance();

        // UI
        UnitFlairManager.getInstance();
        BattleFlairManager.getInstance();
        BattleWindowManager.getInstance();
        HeatmapManager.getInstance();
        SelectionManager.getInstance();
        TooltipService.getInstance();

        // UI State
        const uiState = UIStateMachine.getInstance();
        uiState.changeTo(new NormalUIState());
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new GameState();
        }
        return this.instance;
    }
}