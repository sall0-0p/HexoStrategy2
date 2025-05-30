import {Players, ReplicatedStorage, RunService, Workspace} from "@rbxts/services";
import {Hex} from "../../../../world/hex/Hex";
import {Flair} from "../Flair";
import {ContainerRenderer} from "./ContainerRenderer";

const containerTemplate = ReplicatedStorage.WaitForChild("Assets")
    .WaitForChild("UI")
    .WaitForChild("Map")
    .WaitForChild("Container") as Frame;

const containersContainer = Players.LocalPlayer
    .WaitForChild("PlayerGui")
    .WaitForChild("Flairs") as ScreenGui;

const containerRenderer = new ContainerRenderer();
export class Container {
    private id: string = ContainerCounter.getNextId();
    private hex: Hex;
    private frame: Frame;
    private flairs: Flair[] = [];

    public _visible: boolean = true;
    public _lastPosition: Vector2 = new Vector2();
    public _worldPos: Vector3;
    constructor(hex: Hex) {
        this.hex = hex;
        this.frame = containerTemplate.Clone();
        this.frame.Parent = containersContainer;
        this._worldPos = hex.getModel().GetPivot().Position;

        containerRenderer.addContainer(this);
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

    private updateSize() {
        const childrenQuantity = this.flairs.size();
        this.frame.Size = UDim2.fromOffset(60, 28 * childrenQuantity);
    }

    public getFrame() {
        return this.frame;
    }

    public getFlairs() {
        return this.flairs;
    }
}

class ContainerCounter {
    private static currentId = 0

    public static getNextId() {
        this.currentId++
        return tostring(this.currentId);
    }
}