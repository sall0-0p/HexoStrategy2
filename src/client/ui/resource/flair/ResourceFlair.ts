import {Region} from "../../../world/region/Region";
import {Building, BuildingDefs} from "../../../../shared/data/ts/BuildingDefs";
import {Players, ReplicatedStorage, RunService, Workspace} from "@rbxts/services";
import {RTColor} from "../../../../shared/constants/RichText";
import {Hex} from "../../../world/hex/Hex";
import {BuildingType} from "../../../../shared/types/BuildingDef";
import {ResourceMap} from "../../../../shared/constants/ResourceDef";
import {Connection} from "../../../../shared/classes/Signal";
import {ResourceDefs} from "../../../../shared/data/ts/ResourceDefs";

const baseTemplate = ReplicatedStorage
    .WaitForChild("Assets")
    .WaitForChild("UI")
    .WaitForChild("Resource")
    .WaitForChild("Flair") as Frame;

const itemTemplate = ReplicatedStorage
    .WaitForChild("Assets")
    .WaitForChild("UI")
    .WaitForChild("Resource")
    .WaitForChild("Item") as Frame;

const container = Players.LocalPlayer
    .WaitForChild("PlayerGui")
    .WaitForChild("Flairs")
    .WaitForChild("Resources") as ScreenGui;

export class ResourceFlair {
    public readonly frame: Frame;
    private renderConnection: RBXScriptConnection;
    private resourceConnection: Connection
    private position: Vector3;

    constructor(
        private readonly target: Region,
    ) {
        this.frame = baseTemplate.Clone();
        this.position = this.computePosition();

        this.renderConnection = RunService.RenderStepped.Connect(() => this.onRender());
        this.resourceConnection = target.getResources().updated.connect(() => this.onResourceUpdate());
        this.frame.Parent = container;

        this.onResourceUpdate();
    }

    private computePosition() {
        const hexes = this.target.getHexes();
        let aggregate: Vector3 = Vector3.zero;

        hexes.forEach((h) => {
            const position = h.getModel().GetPivot().Position;
            aggregate = aggregate.add(position);
        })

        return aggregate.div(hexes.size());
    }

    public onRender() {
        const camera = Workspace.CurrentCamera!;
        const point = camera.WorldToViewportPoint(this.position)[0];

        this.frame.Position = UDim2.fromOffset(point.X, point.Y);
    }

    public onResourceUpdate() {
        const resources = this.target.getResources().getAll();
        this.frame.GetChildren().forEach((child) => {
            if (child.IsA("Frame")) {
                child.Destroy();
            }
        })

        let counter = 0;
        resources.forEach((c, r) => {
            if (c === 0) return;
            const def = ResourceDefs[r];
            const item = itemTemplate.Clone();

            const icon = item.WaitForChild("Icon") as ImageLabel;
            const label = item.WaitForChild("Label") as TextLabel;

            icon.Image = def.icon;
            label.Text = tostring(c);

            item.LayoutOrder = def.layoutOrder;
            item.Parent = this.frame;

            counter++;
        })

        if (counter > 0) {
            this.frame.Visible = true;
        } else {
            this.frame.Visible = false;
        }
    }

    public destroy() {
        this.renderConnection.Disconnect();
        this.resourceConnection.disconnect();
        this.frame.Destroy();
    }
}