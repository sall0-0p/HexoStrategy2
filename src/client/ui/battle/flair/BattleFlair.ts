import {Players, ReplicatedStorage, Workspace} from "@rbxts/services";
import {Hex} from "../../../world/hex/Hex";

const flairTemplate = ReplicatedStorage.WaitForChild("Assets")
    .WaitForChild("UI")
    .WaitForChild("Map")
    .WaitForChild("BattleFlair") as Frame;

const battlesContainer = Players.LocalPlayer
    .WaitForChild("PlayerGui")
    .WaitForChild("Battles") as ScreenGui;

export class BattleFlair {
    private frame: Frame;
    private parentHex: Hex;
    private attackingHex: Hex;
    private position: Vector3;

    private camera = Workspace.CurrentCamera!;
    constructor(parentHex: Hex, attackingHex: Hex) {
        this.frame = flairTemplate.Clone();
        this.parentHex = parentHex;
        this.attackingHex = attackingHex;
        this.position = this.calculatePosition(parentHex, attackingHex);

        this.frame.Parent = battlesContainer;
    }

    // progress is at 0-1
    public updateProgress(progress: number) {
        const field = this.frame.WaitForChild("Indicator")
            .WaitForChild("Container")
            .WaitForChild("Progress") as TextLabel;

        field.Text = tostring(math.round(progress * 100));

        // colors
        const inner = this.frame.WaitForChild("Inner") as Frame;
        const stroke = this.frame.WaitForChild("UIStroke") as UIStroke;

        if (progress > 0.5) {
            this.frame.BackgroundColor3 = Color3.fromRGB(69, 255, 31);
            inner.BackgroundColor3 = Color3.fromRGB(61, 168, 75);
            stroke.Color = Color3.fromRGB(63, 137, 72);
        } else {
            this.frame.BackgroundColor3 = Color3.fromRGB(246, 51, 83);
            inner.BackgroundColor3 = Color3.fromRGB(154, 59, 70);
            stroke.Color = Color3.fromRGB(150, 46, 49);
        }
    }

    public render() {
        const [screen] = this.camera.WorldToViewportPoint(this.position);
        this.frame.Position = UDim2.fromOffset(screen.X, screen.Y);
    }

    public destroy() {
        this.frame.Destroy();
    }

    private calculatePosition(hexA: Hex, hexB: Hex): Vector3 {
        const hexAv3 = hexA.getPosition().toWorldPos();
        const hexBv3 = hexB.getPosition().toWorldPos();
        return hexAv3.Lerp(hexBv3, 0.4);
    }
}

class FlairCounter {
    private static currentId = 0

    public static getNextId() {
        this.currentId++
        return tostring(this.currentId);
    }
}