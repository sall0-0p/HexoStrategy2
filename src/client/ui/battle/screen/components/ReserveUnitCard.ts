import {ReplicatedStorage} from "@rbxts/services";
import {Unit} from "../../../../systems/unit/Unit";
import {CombatantSummaryDTO} from "../../../../../shared/dto/BattleSubscription";
import {UnitRepository} from "../../../../systems/unit/UnitRepository";
import {TooltipService} from "../../../generic/tooltip/TooltipService";
import {TextComponent} from "../../../generic/tooltip/components/TextComponent";
import {TextUtils} from "../../../../../shared/classes/TextUtils";

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

        this.applyTooltips();
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

    private applyTooltips() {
        const bars = this.frame.WaitForChild("Margin")
            .WaitForChild("Bars") as Frame;
        const orgBar = bars.WaitForChild("Org") as Frame;
        const hpBar = bars.WaitForChild("HP") as Frame;
        const tooltipService = TooltipService.getInstance();

        // Bars (ORG)
        tooltipService.bind(orgBar, [
            { class: TextComponent, get: () => {
                    const org = TextUtils.trimDecimals(this.unit.getOrganisation(), 1);
                    const maxOrg = TextUtils.trimDecimals(this.unit.getMaxOrg(), 1);
                    const text = `Organisation: <font color="rgb(255, 203, 54)" >${org}/${maxOrg}</font>`;
                    return {text};
                }}
        ]);

        // Bars (HP)
        tooltipService.bind(hpBar, [
            { class: TextComponent, get: () => {
                    const hp = this.unit.getHp()
                    const maxHp = this.unit.getMaxHp()
                    const percentage = math.clamp((hp / maxHp) * 100, 0, 100);
                    const trimmedPercentage = TextUtils.trimDecimals(percentage, 1);
                    const text = `Strength: <font color="rgb(255, 203, 54)">${trimmedPercentage}%</font>`;
                    return {text};
                }}
        ]);

        tooltipService.bind(this.frame, [
            { class: TextComponent, get: () => {
                return { text: `${this.unit.getName()}`};
            }}
        ])
    }

    public destroy() {
        this.frame.Destroy();
    };
}