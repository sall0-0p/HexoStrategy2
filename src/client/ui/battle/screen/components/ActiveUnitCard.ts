import {CombatantSummaryDTO} from "../../../../../shared/network/battle/Subscription";
import {ReplicatedStorage} from "@rbxts/services";
import {Unit} from "../../../../systems/unit/Unit";
import {UnitRepository} from "../../../../systems/unit/UnitRepository";
import {TooltipService} from "../../../generic/tooltip/TooltipService";
import {TextComponent} from "../../../generic/tooltip/components/TextComponent";
import {TextUtils} from "../../../../../shared/classes/TextUtils";
import {HeaderComponent} from "../../../generic/tooltip/components/HeaderComponent";
import {EmptyComponent} from "../../../generic/tooltip/components/EmptyComponent";
import {SeparatorComponent} from "../../../generic/tooltip/components/SeparatorComponent";
import {RTColor} from "../../../../../shared/config/RichText";
import {TooltipDelay} from "../../../../../shared/config/TooltipDelay";

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
    private data: CombatantSummaryDTO;
    private isAttacker: boolean;

    public constructor(parent: GuiObject, data: CombatantSummaryDTO, isAttacker: boolean) {
        const candidate = UnitRepository.getInstance().getById(data.id);
        if (!candidate) error("Trying to add unexistent unit!");

        this.data = data;
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
        this.data = data;

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
        defence.Text = tostring(this.isAttacker ? data.breakthrough : data.defence);

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
        const stats = this.frame.WaitForChild("Item")
            .WaitForChild("Center")
            .WaitForChild("Stats");
        const defenceBox = stats.WaitForChild("Defence") as Frame;
        const attackBox = stats.WaitForChild("Attack") as Frame;

        const tooltipService = TooltipService.getInstance();

        // Bars (ORG)
        tooltipService.bind(orgBar, [
            { class: TextComponent, get: () => {
                const org = TextUtils.trimDecimals(this.unit.getOrganisation(), 1);
                const maxOrg = TextUtils.trimDecimals(this.unit.getMaxOrg(), 1);
                const text = `Organisation: <font color="${RTColor.Important}" >${org}/${maxOrg}</font>`;
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
                const text = `Strength: <font color="${RTColor.Important}">${trimmedPercentage}%</font>`;
                return {text};
            }}
        ]);

        // Stats (Defence)
        if (this.isAttacker) {
            // Breakthrough tooltip is displayed
            const brt = TextUtils.trimDecimals(this.data.breakthrough, 1);
            tooltipService.bind(defenceBox, [
                { class: HeaderComponent, get: () => {
                    return { text: `Breakthrough: ${brt}`};
                }},
                { class: SeparatorComponent, delay: TooltipDelay.MoreInfo },
                { class: TextComponent, delay: TooltipDelay.MoreInfo, get: () => {
                    return { text: `Determines how effectively a unit can punch through enemy defensive lines—higher breakthrough lets you ignore more of the target’s defence and deal extra damage`};
                }},
            ])
        } else {
            // Defence tooltip is displayed
            const def = TextUtils.trimDecimals(this.data.defence, 1);
            tooltipService.bind(defenceBox, [
                { class: HeaderComponent, get: () => {
                    return { text: `Defence: ${def}`};
                }},
                { class: SeparatorComponent, delay: TooltipDelay.MoreInfo },
                { class: TextComponent, delay: TooltipDelay.MoreInfo, get: () => {
                    return { text: `Measures a unit’s ability to absorb incoming attacks—higher defence reduces the number of successful hits that actually damage your division`};
                }},
            ])
        }

        // Stats (Attack)
        tooltipService.bind(attackBox, [
            { class: HeaderComponent, get: () => {
                return { text: `Total Attack: ${this.data.attack}`};
            }},
            { class: EmptyComponent },
            { class: TextComponent, get: () => {
                return { text: `Soft Attack: <font color="${RTColor.Important}">${this.data.softAttack}</font>`};
            }},
            { class: TextComponent, get: () => {
                return { text: `Hard Attack: <font color="${RTColor.Important}">${this.data.hardAttack}</font>`};
            }},
            { class: SeparatorComponent, delay: TooltipDelay.MoreInfo },
            { class: TextComponent, delay: TooltipDelay.MoreInfo, get: () => {
                return { text: `Soft attack hurts unarmored troops; hard attack tears through tanks. They’re merged by enemy hardness to form your final attack value.`};
            }},
        ])

        // Unit card
        const hardness = math.clamp(math.round(this.data.hardness * 100), 0, 100);
        tooltipService.bind(this.frame.WaitForChild("Item") as Frame, [
            { class: HeaderComponent, get: () => {
                const name = this.unit.getName();
                return { text: `${name} (${this.isAttacker ? "Attackers" : "Defenders"})` };
            }},
            { class: SeparatorComponent },
            { class: HeaderComponent, get: () => {
                const armor = TextUtils.trimDecimals(this.data.armor, 1);
                return { text: `Armor: ${armor}`};
            }},
            { class: EmptyComponent },
            { class: HeaderComponent, get: () => {
                return { text: `Hardness: ${hardness}%`};
            }},
            { class: TextComponent, get: () => {
                return { text: `Receiving <font color="${RTColor.Important}">${100 - hardness}%</font> damage from all soft attacks`};
            }},
            { class: TextComponent, get: () => {
                return { text: `Receiving <font color="${RTColor.Important}">${hardness}%</font> damage from all hard attacks`};
            }},
            { class: EmptyComponent },
            { class: HeaderComponent, get: () => {
                const piercing = TextUtils.trimDecimals(this.data.piercing, 1);
                return { text: `Piercing: ${piercing}`};
            }},
            { class: TextComponent, get: () => {
                return { text: `Units whose piercing is lower than the target’s armor suffer a damage penalty`};
            }},
        ])
    }
}
