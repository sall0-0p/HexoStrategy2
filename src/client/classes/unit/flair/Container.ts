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
    private id: string = ContainerCounter.getNextId();
    private hex: Hex;
    private frame: Frame;
    private flairs: Flair[] = [];
    constructor(hex: Hex) {
        this.hex = hex;
        this.frame = containerTemplate.Clone();
        this.frame.Parent = containersContainer;

        RunService.BindToRenderStep("ContainerRendering" + this.id, Enum.RenderPriority.Camera.Value - 1, () => this.onRender());
    }

    public addFlair(flair: Flair) {
        this.flairs.push(flair);
        this.updateSize();
    }

    public removeFlair(flair: Flair) {
        this.flairs = this.flairs.filter((f) => {
            return (flair.getId() !== f.getId());
        })
        this.updateSize();
    }

    private onRender() {
        if (this.flairs.size() < 1) return;

        const currentCamera = Workspace.CurrentCamera!;
        const viewportBoundaries = currentCamera.ViewportSize;
        const screenVector3 = currentCamera.WorldToViewportPoint(this.hex.getModel().GetPivot().Position)[0];

        if ((screenVector3.X > 0 && screenVector3.X < viewportBoundaries.X)
        && (screenVector3.Y > 0 && screenVector3.Y < viewportBoundaries.Y)) {
            this.frame.Position = UDim2.fromOffset(screenVector3.X, screenVector3.Y);
            this.frame.Visible = true;
        } else {
            this.frame.Visible = false;
        }
    }

    private updateSize() {
        const childrenQuantity = this.flairs.size();
        this.frame.Size = UDim2.fromOffset(60, 28 * childrenQuantity);
    }

    public getFrame() {
        return this.frame;
    }
}

class ContainerCounter {
    private static currentId = 0

    public static getNextId() {
        this.currentId++
        return tostring(this.currentId);
    }
}