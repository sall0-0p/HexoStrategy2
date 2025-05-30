import {Players, ReplicatedStorage, UserInputService, Workspace} from "@rbxts/services";
import {GameState} from "./core/GameState";
import {HexRepository} from "./world/hex/HexRepository";

const gameState = GameState.getInstance()
gameState.switchNation("PNL");

const hexRepository = HexRepository.getInstance();
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