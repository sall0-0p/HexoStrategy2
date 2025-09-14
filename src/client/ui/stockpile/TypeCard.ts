import {ArchetypeCard} from "./ArchetypeCard";
import {BaseEquipmentType} from "../../systems/equipment/type/BaseEquipmentType";
import {ReplicatedStorage} from "@rbxts/services";
import {EquipmentArchetypeDefs} from "../../../shared/data/ts/EquipmentArchetypeDefs";

const template = ReplicatedStorage.WaitForChild("Assets")
    .WaitForChild("UI")
    .WaitForChild("Stockpile")
    .WaitForChild("TypeCard") as Frame;

export class TypeCard {
    private frame: Frame;
    private count: number = 0;

    public constructor(private readonly parent: ArchetypeCard, private readonly eqType: BaseEquipmentType) {
        this.frame = template.Clone();
        this.frame.Parent = parent.getFrame()
            .WaitForChild("Container")
            .WaitForChild("Secondary")
            .WaitForChild("Container");

        this.populate();
        this.update();
    }

    private populate() {
        // Name
        const label = this.frame.WaitForChild("Left")
            .WaitForChild("TextLabel") as TextLabel;
        label.Text = this.eqType.getName();

        // Icon
        const shadow = this.frame.WaitForChild("Right")
            .WaitForChild("Container")
            .WaitForChild("IconContainer")
            .WaitForChild("Shadow") as ImageLabel;
        const icon = shadow.WaitForChild("Icon") as ImageLabel;

        let image: string;
        if (this.eqType.getIcon() === "") {
            image = EquipmentArchetypeDefs[this.eqType.getArchetype()].genericIcon;
        } else {
            image = this.eqType.getIcon();
        }

        icon.Image = image;
        shadow.Image = image;
    }

    public update() {
        this.count = this.parent.getEquipment()
            .getStockpile()
            .getCountForType(this.eqType);

        const total = this.frame.WaitForChild("Right")
            .WaitForChild("Container")
            .WaitForChild("NumbersContainer")
            .WaitForChild("NumbersContainer")
            .WaitForChild("Container")
            .WaitForChild("Total")
            .WaitForChild("TextLabel") as TextLabel;

        total.Text = this.parent.formatNumber(this.count);
    }

    public destroy() {
        this.frame.Destroy();
    }

    public getType() {
        return this.eqType;
    }
}