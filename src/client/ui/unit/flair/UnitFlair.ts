import {ReplicatedStorage} from "@rbxts/services";
import {Hex} from "../../../world/hex/Hex";
import {Unit} from "../../../systems/unit/Unit";
import {Container} from "./container/Container";
import {UnitStack} from "./UnitStack";
import {TooltipService} from "../../generic/tooltip/TooltipService";
import {TextComponent} from "../../generic/tooltip/components/TextComponent";

const flairTemplate = ReplicatedStorage.WaitForChild("Assets")
    .WaitForChild("UI")
    .WaitForChild("Map")
    .WaitForChild("UnitFlair") as Frame;

export class UnitFlair {
    private id: string;
    private frame: Frame;
    private containers: Map<Hex, Container>;
    private container: Container;
    private hex: Hex;

    constructor(stack: UnitStack, units: Unit[]) {
        this.id = stack.getId();
        this.hex = stack.getHex();
        this.containers = stack.getUnitFlairManager().containers;

        this.container = this.containers.get(this.hex) ?? this.createContainer(this.hex);
        this.frame = flairTemplate.Clone() as Frame;
        this.frame.Name = this.id;
        this.frame.Parent = this.container.getFrame();
        this.setColor(units[0].getOwner().getColor());
        this.setFlag(units[0].getOwner().getFlag());
        this.setQuantity(units.size());
        this.setIcon(units[0].getIcon());
        this.container.addFlair(this);

        TooltipService.getInstance().bind(this.frame,
            () => {
                return {
                    text: "Hello World!"
                }
            },
            [TextComponent]);
    }

    public setColor(color: Color3) {
        const body = this.frame.WaitForChild("Body") as Frame;
        const qtyContainer = this.frame.WaitForChild("Body").WaitForChild("QuantityContainer") as Frame;
        const iconLabel = this.frame.WaitForChild("Body")
            .WaitForChild("IconContainer")
            .WaitForChild("TemplateIcon") as ImageLabel;

        body.BackgroundColor3 = color;
        qtyContainer.BackgroundColor3 = color;

        // Icon color offset,
        // applied to make icons a bit brighter compared to everything else
        const offset = 100/255;
        const iconColor = new Color3(color.R + offset, color.G + offset, color.B + offset)
        iconLabel.ImageColor3 = iconColor;
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

    public setIcon(icon: string) {
        const iconLabel = this.frame.WaitForChild("Body")
            .WaitForChild("IconContainer")
            .WaitForChild("TemplateIcon") as ImageLabel;

        iconLabel.Image = icon;
    }

    public setSelected(selected: boolean) {
        const outline = this.frame.WaitForChild("Outline") as Frame;
        outline.Visible = selected;
    }

    public destroy() {
        this.container.removeFlair(this);
        this.frame.Destroy();
    }

    public getId() {
        return this.id;
    }

    public getFrame() {
        return this.frame;
    }

    private createContainer(hex: Hex) {
        const container = new Container(hex);
        this.containers.set(hex, container);
        return container;
    }
}