import {Players, ReplicatedStorage, RunService, Workspace} from "@rbxts/services";
import {Hex} from "../../hex/Hex";
import {Unit} from "../Unit";
import {Connection} from "../../../../shared/classes/Signal";
import {Container} from "./Container";

const flairTemplate = ReplicatedStorage.WaitForChild("Assets")
    .WaitForChild("UI")
    .WaitForChild("Map")
    .WaitForChild("UnitFlair") as Frame;

export class Flair {
    private id: string;
    private frame: Frame;
    private containers: Map<Hex, Container>;
    private container: Container;
    private hex: Hex;

    constructor(unit: Unit, hex: Hex, qty: number, containers: Map<Hex, Container>) {
        this.id = FlairCounter.getNextId();
        this.hex = hex;
        this.containers = containers;

        this.container = containers.get(hex) ?? this.createContainer(hex);
        this.frame = flairTemplate.Clone() as Frame;;
        this.frame.Parent = this.container.getFrame();
        this.setColor(unit.getOwner().getColor());
        this.setFlag(unit.getOwner().getFlag());
        this.setQuantity(qty);
        this.container.addFlair(this);
    }

    public setColor(color: Color3) {
        const body = this.frame.WaitForChild("Body") as Frame;
        const qtyContainer = this.frame.WaitForChild("Body").WaitForChild("QuantityContainer") as Frame;

        body.BackgroundColor3 = color;
        qtyContainer.BackgroundColor3 = color;
    }

    public setFlag(flag: string) {
        const flagLabel = this.frame.WaitForChild("Body")
            .WaitForChild("IconContainer")
            .WaitForChild("FlagLabel") as ImageLabel;

        flagLabel.Image = flag;
    }

    public setQuantity(qty: number) {
        const label = this.frame.WaitForChild("Body")
            .WaitForChild("QuantityContainer")
            .WaitForChild("Label") as TextLabel;

        label.Text = tostring(qty);
    }

    public setHp(hp: number) {
        const hpBar = this.frame.WaitForChild("Body")
            .WaitForChild("IconContainer")
            .WaitForChild("HPBody")
            .WaitForChild("HPBar") as Frame;

        hpBar.Size = UDim2.fromScale(hp, 1);
    }

    public setOrganisation(org: number) {
        const orgBar = this.frame.WaitForChild("Body")
            .WaitForChild("IconContainer")
            .WaitForChild("OrgBody")
            .WaitForChild("OrganisationBar") as Frame;

        orgBar.Size = UDim2.fromScale(org, 1);
    }

    public destroy() {
        this.container.removeFlair(this);
        this.frame.Destroy();
    }

    public getId() {
        return this.id;
    }

    private createContainer(hex: Hex) {
        const container = new Container(hex);
        this.containers.set(hex, container);
        return container;
    }
}

export class FlairCounter {
    private static currentId = 0

    public static getNextId() {
        this.currentId++
        return tostring(this.currentId);
    }
}