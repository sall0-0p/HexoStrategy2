import {Building} from "../../../shared/data/ts/BuildingDefs";
import {Players, ReplicatedStorage, TweenService} from "@rbxts/services";

const template = ReplicatedStorage
    .WaitForChild("Assets")
    .WaitForChild("UI")
    .WaitForChild("Construction")
    .WaitForChild("Main") as Frame;

const location = Players.LocalPlayer.WaitForChild("PlayerGui")
    .WaitForChild("Windows")
    .WaitForChild("ConstructionWindow") as ScreenGui;

export class ConstructionWindow {
    private frame: Frame;

    constructor(building?: Building) {
        this.frame = template.Clone();
        this.frame.Parent = location;

        this.populateAvailableBuildings();
        this.populateConstructions();
        this.open();

        // Binding close button
        const close = this.frame.WaitForChild("Header").WaitForChild("Close") as TextButton;
        close.MouseButton1Click.Connect(() => this.close());
    }

    private open() {
        TweenService.Create(this.frame, new TweenInfo(0.5, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
            Position: new UDim2(0, -8, 0.11, 0),
        }).Play();
    }

    public close() {
        const tween = TweenService.Create(this.frame, new TweenInfo(0.5, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
            Position: new UDim2(-1, -8, 0.11, 0),
        });

        tween.Play();
        tween.Completed.Once(() =>
            this.destroy());
    }

    public destroy() {
        this.frame.Destroy();
    }

    private populateAvailableBuildings() {

    }

    private populateConstructions() {

    }
}