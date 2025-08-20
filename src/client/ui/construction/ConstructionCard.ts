import {
    ConstructionEmitter,
    CurrentProject,
    MessageData,
    MessageType
} from "../../../shared/tether/messages/Construction";
import {ReplicatedStorage, RunService} from "@rbxts/services";
import {BuildingDefs} from "../../../shared/data/ts/BuildingDefs";
import {BuildingType} from "../../../shared/classes/BuildingDef";
import {Region} from "../../world/region/Region";
import {Hex} from "../../world/hex/Hex";
import {RegionRepository} from "../../world/region/RegionRepository";
import {HexRepository} from "../../world/hex/HexRepository";
import {Definition} from "../../../shared/config/Definition";
import {DragOrder} from "./DragOrder";

const template = ReplicatedStorage.WaitForChild("Assets")
    .WaitForChild("UI")
    .WaitForChild("Construction")
    .WaitForChild("NormalCard") as TextButton;

export class ConstructionCard {
    public readonly id: string;
    private frame: TextButton;
    private target: Region | Hex;
    private factoriesAssigned: number = 0;
    private connection: RBXScriptConnection;
    constructor(private container: GuiObject, private position: number, private data: CurrentProject, private updatePosition: (index: number) => void) {
        this.id = data.id;
        this.frame = template.Clone();
        this.frame.LayoutOrder = position * 10;
        this.target = this.fetchTarget();
        this.connection = RunService.RenderStepped.Connect(() => this.renderProgress());

        this.frame.Destroying.Connect(() => this.connection.Disconnect());

        this.populateInfo(data);
        this.buildButtons();
        this.frame.Parent = this.container;

        new DragOrder(this, container as ScrollingFrame, (to) => this.move(to));
    }

    public getId() {
        return this.id;
    }

    public getPosition() {
        return this.position;
    }

    public setPosition(position: number) {
        this.frame.LayoutOrder = position * 10;
        this.position = position;
    }

    public update(payload: MessageData[MessageType.ConstructionProgressUpdate]) {
        this.factoriesAssigned = payload.factories;

        const container = this.frame.WaitForChild("Right")
            .WaitForChild("Container")
            .WaitForChild("ProgressContainer") as Frame;
        const progressBar = container.WaitForChild("Progress")
            .WaitForChild("Value") as Frame;
        const factoryCount = container.WaitForChild("Factories").WaitForChild("TextLabel") as TextLabel;

        const progress: number = payload.progress / payload.effectiveCost;
        progressBar.Size = UDim2.fromScale(progress, 1);
        factoryCount.Text = `${payload.factories}/${Definition.MaxFactoriesOnConstructionProject}`;
    }

    public destroy() {
        this.frame.Destroy();
    }

    private populateInfo(data: CurrentProject) {
        const def = BuildingDefs[data.type];

        const label = this.frame.WaitForChild("Left")
            .WaitForChild("TextLabel") as TextLabel
        if (def.type === BuildingType.Hex) {
            label.Text = (this.target as Hex).getRegion()?.getName() ?? "???";
        } else {
            label.Text = this.target.getName();
        }

        const icon = this.frame.WaitForChild("Right")
            .WaitForChild("Container")
            .WaitForChild("IconContainer")
            .WaitForChild("Icon") as ImageLabel;

        icon.Image = def.icon;
        icon.ImageColor3 = def.iconColor3 ?? Color3.fromRGB(255, 255, 255);
    }

    public move(to: number) {
        const promise = ConstructionEmitter.server.invoke(
            MessageType.MoveConstructionRequest,
            MessageType.MoveConstructionResponse,
            { constructionId: this.id, position: to }
        );

        promise.then((payload) => {
            if (!payload.success) error(`Failed to move ${this.getId()} to ${to}`);
            this.updatePosition(to);
        })
    }

    private buildButtons() {
        const container = this.frame.WaitForChild("Right")
            .WaitForChild("Container")
            .WaitForChild("ControlContainer")
            .WaitForChild("Frame");

        const up = container.WaitForChild("ArrowUp") as TextButton;
        const down = container.WaitForChild("ArrowDown") as TextButton;
        const cancel = container.WaitForChild("Cancel") as TextButton;

        up.MouseButton1Click.Connect(() => this.move(this.position - 1));
        down.MouseButton1Click.Connect(() => this.move(this.position + 1));
        cancel.MouseButton1Click.Connect(() => this.cancel());
    }

    private cancel() {
        ConstructionEmitter.server.invoke(
            MessageType.CancelConstructionRequest,
            MessageType.CancelConstructionResponse,
            { constructionId: this.id }
        );
    }

    private fetchTarget() {
        const def = BuildingDefs[this.data.type];
        const buildingType = def.type;

        let owner: Region | Hex;
        if (buildingType === BuildingType.Region || buildingType === BuildingType.Shared) {
            const candidate = RegionRepository.getInstance().getById(this.data.target);
            if (!candidate) error(`Failed to fetch region ${this.data.target}`);
            owner = candidate;
        } else {
            const candidate = HexRepository.getInstance().getById(this.data.target);
            if (!candidate) error(`Failed to fetch hex ${this.data.target}`);
            owner = candidate;
        }

        return owner;
    }

    private renderProgress() {
        if (this.factoriesAssigned <= 0) return;

        const progressBar = this.frame.WaitForChild("Right")
            .WaitForChild("Container")
            .WaitForChild("ProgressContainer")
            .WaitForChild("Factories")
            .WaitForChild("Bar") as ImageLabel;

        const position = progressBar.Position.X.Scale;
        if (position >= 0) {
            progressBar.Position = UDim2.fromScale(-1, 0);
        } else {
            progressBar.Position = UDim2.fromScale(position + (0.001 * this.factoriesAssigned), 0);
        }
    }

    public getFrame() { return this.frame; }
}