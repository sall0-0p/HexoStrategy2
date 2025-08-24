import {ReplicatedStorage} from "@rbxts/services";
import {FactoryReservationType} from "../../../shared/constants/FactoryDef";
import {ConstructionWindow} from "./ConstructionWindow";
import {NationRepository} from "../../world/nation/NationRepository";
import {FactoryReservationDefs} from "../../../shared/data/ts/FactoryReservationDefs";

const template = ReplicatedStorage
    .WaitForChild("Assets")
    .WaitForChild("UI")
    .WaitForChild("Construction")
    .WaitForChild("SpecialCard") as Frame;

export class SpecialCard {
    private nation = NationRepository.getInstance().getById(_G.activeNationId)!;
    private frame: Frame;

    constructor(private container: ScrollingFrame, private readonly reservationType: FactoryReservationType) {
         const factories = this.nation.getFactories();
         const conn = factories.updated.connect(() => this.update());
         this.container.Destroying.Once(() => conn.disconnect());

         this.frame = template.Clone();
         this.build();
         this.update();
    }

    private build() {
        const def = FactoryReservationDefs[this.reservationType];
        const container = this.frame.WaitForChild("Right")
            .WaitForChild("Container") as Frame;

        const label = this.frame.WaitForChild("Left")
            .WaitForChild("TextLabel") as TextLabel;
        label.Text = def.name;

        const icon = container.WaitForChild("IconContainer")
            .WaitForChild("Icon") as ImageLabel;
        icon.Image = def.icon;

        this.frame.LayoutOrder = -100 + def.layoutOrder;
    }

    private update() {
        const factories = this.nation.getFactories();
        const count = factories.getReservations().get(this.reservationType)!
        if (factories.getReservations().has(this.reservationType) && count > 0) {
            this.frame.Parent = this.container;
        } else {
            this.frame.Parent = undefined;
            return;
        }

        // Label
        const label = this.frame.WaitForChild("Right")
            .WaitForChild("Container")
            .WaitForChild("Factories")
            .WaitForChild("TextLabel") as TextLabel;

        label.Text = tostring(count);
    }
}