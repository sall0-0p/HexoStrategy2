import {ReplicatedStorage} from "@rbxts/services";
import {Unit} from "../../../../systems/unit/Unit";
import {CombatantSummaryDTO} from "../../../../../shared/dto/BattleSubscription";
import {UnitRepository} from "../../../../systems/unit/UnitRepository";

const template = ReplicatedStorage
    .WaitForChild("Assets")
    .WaitForChild("UI")
    .WaitForChild("Battle")
    .WaitForChild("ReserveUnitCard") as ImageLabel;

export class ReserveUnitCard {
    private frame: ImageLabel;
    private unit: Unit;
    private isAttacker: boolean;

    public constructor(parent: GuiObject, data: CombatantSummaryDTO, isAttacker: boolean) {
        const candidate = UnitRepository.getInstance().getById(data.id);
        if (!candidate) error("Trying to add unexistent unit!");

        this.frame = template.Clone();
        this.frame.Parent = parent;
        this.isAttacker = isAttacker;
        this.unit = candidate;

        this.update(data);
    }

    public update(data: CombatantSummaryDTO) {
        // Flag
        this.frame.Image = this.unit.getOwner().getFlag();

        // Name
        const nameLabel = this.frame.WaitForChild("Margin")
            .WaitForChild("Name") as TextLabel;
        nameLabel.Text = this.unit.getName();

        // Bars
        this.updateBars();
    }

    private updateBars() {
        const bars = this.frame.WaitForChild("Margin")
            .WaitForChild("Bars") as Frame;
        const orgBar = bars.WaitForChild("Org").WaitForChild("Value") as Frame;
        const hpBar = bars.WaitForChild("HP").WaitForChild("Value") as Frame;

        orgBar.Size = UDim2.fromScale(1, this.unit.getOrganisation() / this.unit.getMaxOrg());
        hpBar.Size = UDim2.fromScale(1, this.unit.getHp() / this.unit.getMaxHp());
    }

    public destroy() {
        this.frame.Destroy();
    };
}