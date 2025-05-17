import {ReplicatedStorage} from "@rbxts/services";
import {Hex} from "../../hex/Hex";
import {Unit} from "../Unit";
import {Connection} from "../../../../shared/classes/Signal";

const flairTemplate = ReplicatedStorage.WaitForChild("Assets")
    .WaitForChild("UI")
    .WaitForChild("Map")
    .WaitForChild("UnitFlair");

export class Flair {
    private frame: Frame;

    constructor(unit: Unit, hex: Hex, qty: number) {
        const frame = flairTemplate.Clone() as Frame;
        const container = hex.getModel()
            .WaitForChild("Base")
            .WaitForChild("FlairContainer") as BillboardGui;

        frame.Parent = container;
        this.frame = frame;
        this.setColor(unit.getOwner().getColor());
        this.setFlag(unit.getOwner().getFlag());
        this.setQuantity(qty);
        this.adjustParentSize(container);
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
        const parent = this.frame.Parent! as BillboardGui;
        this.frame.Destroy();
        this.adjustParentSize(parent);
    }

    private adjustParentSize(parent: BillboardGui) {
        const childrenQuantity = parent?.GetChildren().size();
        parent.Size = UDim2.fromOffset(60, 28 * childrenQuantity);
    }
}