import {HexRepository} from "./world/hex/HexRepository";
import {NationRepository} from "./world/nation/NationRepository";
import {HeatmapManager} from "./ui/heatmap/HeatmapManager";
import {NationHeatmap} from "./ui/heatmap/heatmaps/NationHeatmap";
import {UnitRepository} from "./systems/unit/UnitRepository";
import {UnitFlairManager} from "./systems/unit/flair/UnitFlairManager";
import {Camera} from "./ui/camera/Camera";
import {SelectionManager} from "./ui/selection/SelectionManager";
import {Players, ReplicatedStorage, UserInputService, Workspace} from "@rbxts/services";
import {RegionReplicatorMessage} from "../shared/dto/RegionReplicatorMessage";
import {UnitReplicatorMessage} from "../shared/dto/UnitReplicatorMessage";
import {RegionRepository} from "./world/region/RegionRepository";

const camera = Camera.getInstance();
const nationRepository = NationRepository.getInstance();
const hexRepository = HexRepository.getInstance();
const regionRepository = RegionRepository.getInstance();
const unitRepository = UnitRepository.getInstance();
const unitFlairManager = UnitFlairManager.getInstance();
hexRepository.getLoadedSignal().wait();
const heatmapManager = HeatmapManager.getInstance();
const selectionManager = SelectionManager.getInstance();

heatmapManager.showHeatmap(new NationHeatmap());

UserInputService.InputEnded.Connect((input: InputObject) => {
    if (input.UserInputType === Enum.UserInputType.MouseButton1) {
        const player = Players.LocalPlayer;
        const mouse = player.GetMouse();
        const camera = Workspace.CurrentCamera!;
        const unitRay = camera.ScreenPointToRay(mouse.X, mouse.Y);
        const raycastParams = new RaycastParams();
        raycastParams.FilterType = Enum.RaycastFilterType.Whitelist;
        raycastParams.AddToFilter(Workspace.WaitForChild("Heatmaps"));
        raycastParams.AddToFilter(Workspace.WaitForChild("Hexes"));

        const raycastResult = Workspace.Raycast(unitRay.Origin, unitRay.Direction.mul(1000), raycastParams);
        if (raycastResult) {
            const instance = raycastResult.Instance;
            const hexModel = instance.FindFirstAncestorOfClass("Model");
            if (!hexModel) return;
            const hexId = hexModel.Name;
            print(`[DEBUG]: Hex with id ${hexId}`, hexRepository.getById(hexId));
        }
    }
})