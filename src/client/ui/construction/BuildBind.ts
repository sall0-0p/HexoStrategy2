import {Bind} from "../Bind";
import {Building, BuildingDefs} from "../../../shared/data/ts/BuildingDefs";
import {Players, UserInputService, Workspace} from "@rbxts/services";
import {HexRepository} from "../../world/hex/HexRepository";
import {Hex} from "../../world/hex/Hex";
import {ConstructionEmitter, MessageType} from "../../../shared/tether/messages/Construction";
import {Region} from "../../world/region/Region";
import {BuildingType} from "../../../shared/classes/BuildingDef";

const localPlayer = Players.LocalPlayer;
const playerGui = localPlayer.WaitForChild("PlayerGui") as PlayerGui;
const mouse = localPlayer.GetMouse()
const raycastParams = new RaycastParams();
raycastParams.FilterType = Enum.RaycastFilterType.Whitelist;
raycastParams.AddToFilter(Workspace.WaitForChild("Heatmaps"));
raycastParams.AddToFilter(Workspace.WaitForChild("Hexes"));
export class BuildBind implements Bind {
    private connection: RBXScriptConnection;
    private hexRepository = HexRepository.getInstance();

    constructor(private readonly building: Building) {
        this.connection = UserInputService.InputEnded.Connect((object: InputObject) => {
            if (object.UserInputType === Enum.UserInputType.MouseButton1) {
                this.trigger();
            }
        })
    }

    public unbind() {
        this.connection.Disconnect();
    }

    private trigger() {
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
                this.orderConstruction(hex);
            }
        }
    }

    private orderConstruction(hex: Hex) {
        if (BuildingDefs[this.building].type === BuildingType.Hex) {
            this.orderHexConstruction(hex);
        } else {
            const region = hex.getRegion();
            if (!region) return;
            this.orderRegionConstruction(region);
        }

    }

    private orderHexConstruction(hex: Hex) {
        const container = hex.getBuildings();
        const built = container.buildings.get(this.building) ?? 0;
        const slots = container.slots.get(this.building) ?? 0;
        const planned = container.planned.get(this.building) ?? 0;

        if ((built + planned) > slots) return;

        const promise = ConstructionEmitter.server.invoke(
            MessageType.StartConstructionRequest,
            MessageType.StartConstructionResponse,
            {
                targetId: hex.getId(),
                building: this.building,
            }
        );

        promise.then((res) => {
            print(res.success, res.reason);
        })
    }

    private orderRegionConstruction(region: Region) {
        const container = region.getBuildings();
        const built = container.buildings.get(this.building) ?? 0;
        const slots = container.slots.get(this.building) ?? 0;
        const planned = container.planned.get(this.building) ?? 0;

        if ((built + planned) > slots) return;

        const promise = ConstructionEmitter.server.invoke(
            MessageType.StartConstructionRequest,
            MessageType.StartConstructionResponse,
            {
                targetId: region.getId(),
                building: this.building,
            }
        );
    }
}