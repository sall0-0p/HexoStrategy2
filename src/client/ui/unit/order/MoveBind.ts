import {Players, ReplicatedStorage, UserInputService, Workspace} from "@rbxts/services";
import {SelectionManager} from "../selection/SelectionManager";
import {HexRepository} from "../../../world/hex/HexRepository";
import {Hex} from "../../../world/hex/Hex";
import {Unit} from "../../../systems/unit/Unit";
import {NationRepository} from "../../../world/nation/NationRepository";
import {UnitMoveRequest} from "../../../../shared/dto/UnitOrderRequest";
import {Bind} from "../../Bind";

const orderRemote = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("UnitOrder") as RemoteFunction;

const localPlayer = Players.LocalPlayer;
const playerGui = localPlayer.WaitForChild("PlayerGui") as PlayerGui;
const mouse = localPlayer.GetMouse()
const raycastParams = new RaycastParams();
raycastParams.FilterType = Enum.RaycastFilterType.Whitelist;
raycastParams.AddToFilter(Workspace.WaitForChild("Heatmaps"));
raycastParams.AddToFilter(Workspace.WaitForChild("Hexes"));
export class MoveBind implements Bind {
    private selectionManager = SelectionManager.getInstance();
    private nationRepository = NationRepository.getInstance();
    private hexRepository = HexRepository.getInstance();

    private connection;
    constructor() {
        this.connection = UserInputService.InputEnded.Connect((object: InputObject) => {
            if (object.UserInputType === Enum.UserInputType.MouseButton2) {
                this.trigger();
            }
        })
    }

    public unbind() {
        this.connection.Disconnect();
    }

    private trigger() {
        const selectedUnits = this.selectionManager.getSelectedUnits();
        if (selectedUnits.size() === 0) return;

        if (playerGui.GetGuiObjectsAtPosition(mouse.X, mouse.Y).size() === 0) {
            const camera = Workspace.CurrentCamera!;
            const unitRay = camera.ScreenPointToRay(mouse.X, mouse.Y);

            const raycastResult = Workspace.Raycast(unitRay.Origin, unitRay.Direction.mul(1000), raycastParams);
            if (raycastResult) {
                const instance = raycastResult.Instance;
                const hexModel = instance.FindFirstAncestorOfClass("Model");
                if (!hexModel) return;
                const hexId = hexModel.Name;

                const hex = this.hexRepository.getById(hexId);
                if (!hex) return;
                this.orderMovement(hex, selectedUnits);
            }
        }
    }

    private orderMovement(hex: Hex, selectedUnits: Unit[]) {
        const hexOwner = hex.getOwner();
        const playedNationId = _G.activeNationId;
        const playedNation = this.nationRepository.getById(playedNationId!);
        if (!hexOwner
            || hexOwner.getId() === playedNationId
            || playedNation?.getAllies().includes(hexOwner)
            || playedNation?.getEnemies().includes(hexOwner)
        ) {
            orderRemote.InvokeServer({
                request: "move",
                units: selectedUnits.map((unit) => unit.getId()),
                destination: hex.getId(),
            } as UnitMoveRequest)
        } else {
            warn(`You cannot move here!`);
        }
    }
}