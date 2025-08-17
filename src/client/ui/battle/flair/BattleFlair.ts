import {Players, ReplicatedStorage, Workspace} from "@rbxts/services";
import {Hex} from "../../../world/hex/Hex";
import {BattleWindowManager} from "../screen/BattleWindowManager";
import {BattleSummaryDTO} from "../../../../shared/network/battle/DTO";
import {TooltipService} from "../../generic/tooltip/TooltipService";
import {TextComponent} from "../../generic/tooltip/components/TextComponent";
import {Unit} from "../../../systems/unit/Unit";
import {UnitRepository} from "../../../systems/unit/UnitRepository";
import {Nation} from "../../../world/nation/Nation";
import {RTColor, RTWidth} from "../../../../shared/config/RichText";
import {TextUtils} from "../../../../shared/classes/TextUtils";
import {EmptyComponent} from "../../generic/tooltip/components/EmptyComponent";
import {SeparatorComponent} from "../../generic/tooltip/components/SeparatorComponent";
import {TooltipDelay} from "../../../../shared/config/TooltipDelay";

const flairTemplate = ReplicatedStorage.WaitForChild("Assets")
    .WaitForChild("UI")
    .WaitForChild("Map")
    .WaitForChild("BattleFlair") as TextButton;

const battlesContainer = Players.LocalPlayer
    .WaitForChild("PlayerGui")
    .WaitForChild("Flairs")
    .WaitForChild("Battles") as ScreenGui;

export class BattleFlair {
    private battleId: string;
    private frame: TextButton;
    private parentHex: Hex;
    private position: Vector3;
    private connection: RBXScriptConnection;
    private lastPayload?: BattleSummaryDTO;

    private camera = Workspace.CurrentCamera!;
    constructor(id: string, parentHex: Hex, attackingHex: Hex) {
        this.battleId = id;
        this.frame = flairTemplate.Clone();
        this.parentHex = parentHex;
        this.position = this.calculatePosition(parentHex, attackingHex);

        this.frame.Parent = battlesContainer;

        this.connection = this.frame.MouseButton1Click.Connect(() => {
            BattleWindowManager.getInstance().display(this.battleId);
        })

        this.addTooltip();
    }

    // progress is at 0-1
    public update(data: BattleSummaryDTO, attackingHex: Hex) {
        this.position = this.calculatePosition(this.parentHex, attackingHex);
        this.lastPayload = data;

        const progress = (data.approximation + 1) / 2
        const field = this.frame.WaitForChild("Indicator")
            .WaitForChild("Container")
            .WaitForChild("Progress") as TextLabel;

        field.Text = tostring(math.round(progress * 100));

        // colors
        const inner = this.frame.WaitForChild("Inner") as Frame;
        const stroke = this.frame.WaitForChild("UIStroke") as UIStroke;

        if (progress > 0.5) {
            this.frame.BackgroundColor3 = Color3.fromRGB(69, 255, 31);
            inner.BackgroundColor3 = Color3.fromRGB(61, 168, 75);
            stroke.Color = Color3.fromRGB(63, 137, 72);
        } else {
            this.frame.BackgroundColor3 = Color3.fromRGB(246, 51, 83);
            inner.BackgroundColor3 = Color3.fromRGB(154, 59, 70);
            stroke.Color = Color3.fromRGB(150, 46, 49);
        }
    }

    public render() {
        const [screen] = this.camera.WorldToViewportPoint(this.position);
        this.frame.Position = UDim2.fromOffset(screen.X, screen.Y);
    }

    public destroy() {
        this.frame.Destroy();
        this.connection.Disconnect();
    }

    private calculatePosition(hexA: Hex, hexB: Hex): Vector3 {
        const hexAv3 = hexA.getPosition().toWorldPos();
        const hexBv3 = hexB.getPosition().toWorldPos();
        return hexAv3.Lerp(hexBv3, 0.4);
    }

    // Tooltip
    private parseUnits(unitIds: string[]): Unit[] {
        const unitRepository = UnitRepository.getInstance();
        const result: Unit[] = [];

        unitIds.forEach((id) => {
            const unit = unitRepository.getById(id);
            if (unit) result.push(unit);
        })

        return result;
    }

    private parseNations(units: Unit[]) {
        // Scary shit.
        const nationCounts = units.reduce((acc, unit) => {
            const owner = unit.getOwner();
            const entry = acc.find(e => e.nation === owner);
            if (entry) {
                entry.count++;
            } else {
                acc.push({ nation: owner, count: 1 });
            }
            return acc;
        }, [] as { nation: Nation; count: number }[]);

        nationCounts.sort((a, b) => b.count > a.count);

        const format = (n: Nation) => `<font color="${RTColor.Important}">${n.getName()}</font>`;

        if (nationCounts.size() <= 3) {
            return nationCounts
                .map(e => format(e.nation))
                .join(", ");
        } else {
            const first = nationCounts[0].nation;
            const others = nationCounts.size() - 1;
            return `${format(first)} and <font color="${RTColor.Important}">${others}</font> more`;
        }
    }

    private determinePlayerSide(data: BattleSummaryDTO) {
        const units = this.parseUnits(data.attackers);
        const attackingNations = new Set<string>(units.map((u) => u.getOwner().getId()));

        if (attackingNations.has(_G.activeNationId)) {
            return "attacker";
        } else {
            return "defender";
        }
    }

    private addTooltip() {
        let playerSide: "attacker" | "defender" | undefined;
        TooltipService.getInstance().bind(this.frame, [
            { class: TextComponent, get: () => {
                const payload = this.lastPayload;
                if (!payload) return { text: "???" };
                const units: Unit[] = this.parseUnits(payload.attackers);

                const count = `<font color="${RTColor.Important}">${units.size()}</font> ${TextUtils.pluralize(units.size(), "division", "divisions", false)}`
                return { text: `Attackers: ${count} (${this.parseNations(units)})`};
            }},
            { class: TextComponent, get: () => {
                const payload = this.lastPayload;
                if (!payload) return { text: "???" };
                const units: Unit[] = this.parseUnits(payload.defenders);

                const count = `<font color="${RTColor.Important}">${units.size()}</font> ${TextUtils.pluralize(units.size(), "division", "divisions", false)}`
                return { text: `Defenders: ${count} (${this.parseNations(units)})`};
            }},
            { class: TextComponent, get: () => {
                const payload = this.lastPayload;
                if (!payload) return { text: "???" };

                const n = payload.approximation;
                if (math.abs(n) < 0.2) {
                    return { text: `<font width="${RTWidth.Bold}">The battle outcome is yet unknown</font>` };
                }

                const side = playerSide ??= this.determinePlayerSide(payload);
                const isAttacker = side === "attacker";
                const winText  = `<font color="${RTColor.Green}">Our forces are winning!</font>`;
                const loseText = `<font color="${RTColor.Red}">Our forces are losing :(</font>`;

                const weWin = isAttacker ? (n > 0) : (n < 0);
                return { text: weWin ? winText : loseText };
            }},
            { class: TextComponent, get: () => {
                const payload = this.lastPayload;
                if (!payload) return { text: "???" };
                const remaining = payload.hoursRemaining;

                if (remaining < 24) {
                    return { text: `We approximate that battle will end in less than one day` };
                } else {
                    return { text: `We approximate that battle will end in ${math.ceil(remaining / 24)} days`};
                }
            }},
            { class: SeparatorComponent, delay: TooltipDelay.Controls },
            { class: TextComponent, delay: TooltipDelay.Controls, get: () => {
                return { text: `<font color="${RTColor.Green}">Click</font> to open detailed menu`};
            }}
        ])
    }
}