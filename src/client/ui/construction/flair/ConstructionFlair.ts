import {Region} from "../../../world/region/Region";
import {Building, BuildingDefs} from "../../../../shared/data/ts/BuildingDefs";
import {Players, ReplicatedStorage, RunService, Workspace} from "@rbxts/services";
import {RTColor} from "../../../../shared/constants/RichText";
import {Hex} from "../../../world/hex/Hex";
import {BuildingType} from "../../../../shared/types/BuildingDef";

const template = ReplicatedStorage
    .WaitForChild("Assets")
    .WaitForChild("UI")
    .WaitForChild("Construction")
    .WaitForChild("Flair") as Frame;

const container = Players.LocalPlayer
    .WaitForChild("PlayerGui")
    .WaitForChild("Flairs")
    .WaitForChild("Construction") as ScreenGui;

export class ConstructionFlair {
    public readonly frame: Frame;
    private connection: RBXScriptConnection;
    private position: Vector3;

    constructor(
        private readonly target: Region | Hex,
        private readonly building: Building
    ) {
        this.frame = template.Clone();
        this.position = this.computePosition();

        this.connection = RunService.RenderStepped.Connect(() => this.onRender());
        this.frame.Parent = container;
    }

    private computePosition() {
        if (BuildingDefs[this.building].type === BuildingType.Hex) {
            return (this.target as Hex).getModel().GetPivot().Position;
        } else {
            const hexes = (this.target as Region).getHexes();
            let aggregate: Vector3 = Vector3.zero;

            hexes.forEach((h) => {
                const position = h.getModel().GetPivot().Position;
                aggregate = aggregate.add(position);
            })

            return aggregate.div(hexes.size());
        }
    }

    private getCountsForDisplay() {
        const comp = this.target.getBuildings();
        const def = BuildingDefs[this.building];

        if (def.type === BuildingType.Hex) {
            const built = comp.built.get(this.building) ?? 0;
            const planned = comp.planned.get(this.building) ?? 0;
            const slots = comp.slots.get(this.building) ?? 0;
            return {built, planned, slots, buildingType: def.type};
        }

        if (def.type === BuildingType.Shared) {
            let built = 0;
            let planned = 0;
            const slots = comp.slots.get(this.building) ?? 0;

            for (const [_, b] of pairs(Building)) {
                const bd = BuildingDefs[b];
                if (bd.type === BuildingType.Shared) {
                    built += comp.built.get(b) ?? 0;
                    planned += comp.planned.get(b) ?? 0;
                }
            }
            return {built, planned, slots, buildingType: def.type};
        }

        const built = comp.built.get(this.building) ?? 0;
        const planned = comp.planned.get(this.building) ?? 0;
        const slots = comp.slots.get(this.building) ?? 0;
        return {built, planned, slots, buildingType: def.type};
    }


    public onRender() {
        const camera = Workspace.CurrentCamera!;
        const point = camera.WorldToViewportPoint(this.position)[0];

        this.frame.Position = UDim2.fromOffset(point.X, point.Y);

        const { built, planned, slots, buildingType } = this.getCountsForDisplay();
        const show = (buildingType === BuildingType.Hex) ? (built > 0 || planned > 0) : true;

        if (show) {
            this.frame.Visible = true;
            const text = `${built}<font color="${RTColor.Important}">${planned > 0 ? `+${planned}` : ""}</font>/${slots}`;

            const label = this.frame.WaitForChild("Header")
                .WaitForChild("Text") as TextLabel;
            label.Text = text;
        } else {
            this.frame.Visible = false;
        }
    }

    public destroy() {
        this.connection.Disconnect();
        this.frame.Destroy();
    }
}