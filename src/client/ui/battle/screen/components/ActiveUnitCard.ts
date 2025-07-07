import {CombatantSummaryDTO} from "../../../../../shared/dto/BattleSubscription";
import {ReplicatedStorage} from "@rbxts/services";
import {Unit} from "../../../../systems/unit/Unit";
import {UnitRepository} from "../../../../systems/unit/UnitRepository";
import {TooltipService} from "../../../generic/tooltip/TooltipService";
import {TextComponent} from "../../../generic/tooltip/components/TextComponent";
import {TextUtils} from "../../../../../shared/classes/TextUtils";

const attackerPosition = UDim2.fromScale(0.089,0);
const defenderPosition = UDim2.fromScale(0.03, 0);

const template = ReplicatedStorage
    .WaitForChild("Assets")
    .WaitForChild("UI")
    .WaitForChild("Battle")
    .WaitForChild("ActiveUnitCard") as Frame;

export class ActiveUnitCard {
    private frame: Frame;
    private unit: Unit;
    private isAttacker: boolean;

    public constructor(parent: GuiObject, data: CombatantSummaryDTO, isAttacker: boolean) {
        const candidate = UnitRepository.getInstance().getById(data.id);
        if (!candidate) error("Trying to add unexistent unit!");

        this.frame = template.Clone();
        this.frame.Parent = parent;
        this.isAttacker = isAttacker;
        this.unit = candidate;

        const item = this.frame.WaitForChild("Item") as ImageLabel;
        item.Position = isAttacker ? attackerPosition : defenderPosition;

        this.addTooltips();
        this.update(data);
    }

    public update(data: CombatantSummaryDTO) {
        const item = this.frame.WaitForChild("Item") as ImageLabel;

        // Flag
        item.Image = this.unit.getOwner().getFlag();

        // Name
        const nameField = item.WaitForChild("Center")
            .WaitForChild("Name") as TextLabel;
        nameField.Text = this.unit.getName();

        // Icon
        const iconLabel = item.WaitForChild("Left")
            .WaitForChild("TemplateIcon") as ImageLabel;
        iconLabel.Image = this.unit.getIcon();

        // Stats (Defence & Attack)
        const statsCnt = item.WaitForChild("Center")
            .WaitForChild("Stats") as Frame;
        const attack = statsCnt.WaitForChild("Attack")
            .WaitForChild("Value") as TextLabel;
        const defence = statsCnt.WaitForChild("Defence")
            .WaitForChild("Value") as TextLabel;

        attack.Text = tostring(data.attack);
        defence.Text = tostring(data.defence);

        // Bars
        this.updateBars();
    }

    private updateBars() {
        const bars = this.frame.WaitForChild("Item")
            .WaitForChild("Left")
            .WaitForChild("Bars") as Frame;
        const orgBar = bars.WaitForChild("Org").WaitForChild("Value") as Frame;
        const hpBar = bars.WaitForChild("HP").WaitForChild("Value") as Frame;

        orgBar.Size = UDim2.fromScale(1, this.unit.getOrganisation() / this.unit.getMaxOrg());
        hpBar.Size = UDim2.fromScale(1, this.unit.getHp() / this.unit.getMaxHp());
    }

    public destroy() {
        this.frame.Destroy();
    };

    // Tooltips
    private addTooltips() {
        const bars = this.frame.WaitForChild("Item")
            .WaitForChild("Left")
            .WaitForChild("Bars") as Frame;
        const orgBar = bars.WaitForChild("Org") as Frame;
        const hpBar = bars.WaitForChild("HP") as Frame;

        const tooltipService = TooltipService.getInstance();

        // Bars (ORG)
        tooltipService.bind(orgBar, [
            { class: TextComponent, get: () => {
                const org = TextUtils.trimDecimals(this.unit.getOrganisation(), 1);
                const maxOrg = TextUtils.trimDecimals(this.unit.getMaxOrg(), 1);
                const text = `Organisation: <font color="rgb(255, 203, 54)" weight="SemiBold">${org}/${maxOrg}</font>`;
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
                const text = `Strength: <font color="rgb(255, 203, 54)" weight="SemiBold">${trimmedPercentage}%</font>`;
                return {text};
            }}
        ]);

        // Unit card
        tooltipService.bind(this.frame.WaitForChild("Item") as Frame, [
            { class: TextComponent, get: () => {
                return { text: this.unit.getName() };
            }}
        ])
    }
}
