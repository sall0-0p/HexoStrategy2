import {Players, ReplicatedStorage, RunService, Workspace} from "@rbxts/services";
import {Hex} from "../../hex/Hex";
import {Flair} from "./Flair";

const containerTemplate = ReplicatedStorage.WaitForChild("Assets")
    .WaitForChild("UI")
    .WaitForChild("Map")
    .WaitForChild("Container") as Frame;

const containersContainer = Players.LocalPlayer
    .WaitForChild("PlayerGui")
    .WaitForChild("Flairs") as ScreenGui;

export class Container {
    private hex: Hex;
    private frame: Frame;
    private flairs: Flair[] = [];
    constructor(hex: Hex) {
        this.hex = hex;
        this.frame = containerTemplate.Clone();
        this.frame.Parent = containersContainer;

        RunService.BindToRenderStep("ContainerRendering", Enum.RenderPriority.Camera.Value - 1, () => this.onRender());
    }

    public addFlair(flair: Flair) {
        this.flairs.push(flair);
        this.updateSize();
    }

    public removeFlair(flair: Flair) {
        this.flairs = this.flairs.filter((flair) => {
            return (flair.getId() !== flair.getId());
        })
        this.updateSize();
    }

    private onRender() {
        if (this.flairs.size() < 1) return;

        const currentCamera = Workspace.CurrentCamera!;
        const screenVector3 = currentCamera.WorldToViewportPoint(this.hex.getModel().GetPivot().Position)[0];

        this.frame.Position = UDim2.fromOffset(screenVector3.X, screenVector3.Y);
    }

    private updateSize() {
        const childrenQuantity = this.flairs.size();
        this.frame.Size = UDim2.fromOffset(60, 28 * childrenQuantity);
    }

    public getFrame() {
        return this.frame;
    }
}