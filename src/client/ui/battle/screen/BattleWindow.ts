import {Players, ReplicatedStorage, RunService} from "@rbxts/services";
import {BattleUpdate, CombatantSummaryDTO} from "../../../../shared/network/battle/Subscription";
import {Signal} from "../../../../shared/classes/Signal";
import {ActiveUnitCard} from "./components/ActiveUnitCard";
import {TextUtils} from "../../../../shared/classes/TextUtils";
import {ReserveUnitCard} from "./components/ReserveUnitCard";
import {NationRepository} from "../../../world/nation/NationRepository";
import {Draggable} from "../../generic/Draggable";
import {BattleWindowTooltips} from "./BattleWindowTooltips";

const template = ReplicatedStorage
    .WaitForChild("Assets")
    .WaitForChild("UI")
    .WaitForChild("Battle")
    .WaitForChild("Main") as Frame;

const screen = Players.LocalPlayer
    .WaitForChild("PlayerGui")
    .WaitForChild("Windows") as ScreenGui;

export class BattleWindow {
    private frame: Frame;
    public closed = new Signal<[]>;

    // Unit cards
    private defendingLine: Map<string, ActiveUnitCard> = new Map();
    private attackingLine: Map<string, ActiveUnitCard> = new Map();
    private defendingReserve: Map<string, ReserveUnitCard> = new Map();
    private attackingReserve: Map<string, ReserveUnitCard> = new Map();

    // Animated bar
    private bar!: Frame;
    private pointer!: Frame;
    private connection: RBXScriptConnection;

    private currentBarPos = 0;
    private targetBarPos = 0;
    private currentPointerRot = 0;
    private targetPointerRot = 0;

    // Dragging
    private draggable: Draggable;

    // Latest payload for tooltips
    private latestPayload?: BattleUpdate;

    constructor() {
        this.frame = template.Clone();
        this.frame.Parent = screen;

        // Getting bar and pointer
        const prog = this.frame.WaitForChild("ProgressContainer")
            .WaitForChild("Progress")
            .WaitForChild("Bar") as Frame;
        this.bar     = prog.WaitForChild("Value")   as Frame;
        this.pointer = prog.WaitForChild("Pointer") as Frame;

        this.connection = RunService.RenderStepped.Connect((dt) => {
            const alpha = math.clamp(4 * dt, 0, 1);

            this.currentBarPos += (this.targetBarPos - this.currentBarPos) * alpha;
            this.bar.Size = UDim2.fromScale(this.currentBarPos, 1);

            this.currentPointerRot += (this.targetPointerRot - this.currentPointerRot) * alpha;
            this.pointer.Rotation = this.targetPointerRot;

            this.pointer.Position = UDim2.fromScale(this.currentBarPos, 0.5);
        });

        this.draggable = new Draggable(this.frame, this.frame.WaitForChild("Header") as Frame);
        BattleWindowTooltips.applyTooltips(this);

        // close button
        const button = this.frame.WaitForChild("Header")
            .WaitForChild("Close") as TextButton;
        button.MouseButton1Click.Connect(() => this.close());
    }

    public update(payload: BattleUpdate) {
        this.populateActiveCards(payload);
        this.populateReserveCards(payload);
        this.updateCombatWidthLabels(payload);
        this.updateFlags(payload);
        this.updateBar(payload);
        this.updateQtyLabels();
        this.latestPayload = payload;
    }

    public close() {
        this.draggable.destroy();

        this.frame.Destroy();
        this.connection.Disconnect();
        this.closed.fire();
        this.closed.clear();
    }

    // Labels
    private updateQtyLabels() {
        // Line
        const attackingLineQty = this.frame.WaitForChild("Units")
            .WaitForChild("Active")
            .WaitForChild("Attackers")
            .WaitForChild("Quantity") as TextLabel;

        const defendingLineQty = this.frame.WaitForChild("Units")
            .WaitForChild("Active")
            .WaitForChild("Defenders")
            .WaitForChild("Quantity") as TextLabel;

        attackingLineQty.Text = TextUtils.pluralize(this.attackingLine.size(), "Division", "Divisions");
        defendingLineQty.Text = TextUtils.pluralize(this.defendingLine.size(), "Division", "Divisions");

        // Reserve
        const attackingReserveQty = this.frame.WaitForChild("Units")
            .WaitForChild("Reserves")
            .WaitForChild("Attackers")
            .WaitForChild("Quantity") as TextLabel;

        const defendingReserveQty = this.frame.WaitForChild("Units")
            .WaitForChild("Reserves")
            .WaitForChild("Defenders")
            .WaitForChild("Quantity") as TextLabel;

        attackingReserveQty.Text = TextUtils.pluralize(this.attackingReserve.size(), "Reserve", "Reserves");
        defendingReserveQty.Text = TextUtils.pluralize(this.defendingReserve.size(), "Reserve", "Reserves");
    }

    private updateCombatWidthLabels(payload: BattleUpdate) {
        const progressContainer = this.frame.WaitForChild("ProgressContainer");
        const totalCombatWidth = progressContainer.WaitForChild("TotalCombatWidth")
            .WaitForChild("Value") as TextLabel;
        const attackersCombatWidth = progressContainer.WaitForChild("AttackersCombatWidth")
            .WaitForChild("Value") as TextLabel;
        const defendersCombatWidth = progressContainer.WaitForChild("DefendersCombatWidth")
            .WaitForChild("Value") as TextLabel;

        totalCombatWidth.Text = tostring(payload.width.max);
        attackersCombatWidth.Text = tostring(payload.width.attackers);
        defendersCombatWidth.Text = tostring(payload.width.defenders);
    }

    private updateFlags(payload: BattleUpdate) {
        const nationRepository = NationRepository.getInstance();
        const nationAttacking = nationRepository.getById(payload.nations.attackers[0]);
        const nationDefending = nationRepository.getById(payload.nations.defenders[0]);

        if (!nationAttacking || !nationDefending) {
            error("Cannot recognise attacking/defending nation.");
        }

        const attackingFlagLabel = this.frame.WaitForChild("ProgressContainer")
            .WaitForChild("AttackersFlag")
            .WaitForChild("Value") as ImageLabel;
        const defendingFlagLabel = this.frame.WaitForChild("ProgressContainer")
            .WaitForChild("DefendersFlag")
            .WaitForChild("Value") as ImageLabel;

        attackingFlagLabel.Image = nationAttacking.getFlag();
        defendingFlagLabel.Image = nationDefending.getFlag();
    }

    private updateBar(payload: BattleUpdate) {
        this.targetBarPos = (payload.prediction.approximation + 1) / 2;
        this.targetPointerRot    = this.targetBarPos < 0.5 ? 0 : 180;
    }

    // Cards - Active
    private populateActiveCards(payload: BattleUpdate) {
        const attackingContainer = this.frame.WaitForChild("Units")
            .WaitForChild("Active")
            .WaitForChild("Attackers")
            .WaitForChild("Container")
            .WaitForChild("ScrollingFrame") as ScrollingFrame;

        const defendingContainer = this.frame.WaitForChild("Units")
            .WaitForChild("Active")
            .WaitForChild("Defenders")
            .WaitForChild("Container")
            .WaitForChild("ScrollingFrame") as ScrollingFrame;

        this.processActiveCards(attackingContainer, payload, true);
        this.processActiveCards(defendingContainer, payload, false);
    }

    private processActiveCards(container: ScrollingFrame, payload: BattleUpdate, isAttacker: boolean) {
        const line = isAttacker ? this.attackingLine : this.defendingLine;
        const split = this.splitPayload(line,
            isAttacker ? payload.forces.attackers.frontline : payload.forces.defenders.frontline);

        split.toUpdate.forEach((data) => line.get(data.id)?.update(data));
        split.toAdd.forEach((data) => {
            line.set(data.id, new ActiveUnitCard(container, data, isAttacker));
        })
        split.toRemove.forEach((id) => {
            line.get(id)?.destroy()
            line.delete(id);
        })
    }

    // Cards - Reserve
    private populateReserveCards(payload: BattleUpdate) {
        const attackingContainer = this.frame.WaitForChild("Units")
            .WaitForChild("Reserves")
            .WaitForChild("Attackers")
            .WaitForChild("Container") as Frame;

        const defendersContainer = this.frame.WaitForChild("Units")
            .WaitForChild("Reserves")
            .WaitForChild("Defenders")
            .WaitForChild("Container") as Frame;

        this.processReserveCards(attackingContainer, payload, true);
        this.processReserveCards(defendersContainer, payload, false);
    }

    private processReserveCards(container: Frame, payload: BattleUpdate, isAttacker: boolean) {
        const reserve = isAttacker ? this.attackingReserve : this.defendingReserve;
        const split = this.splitPayload(reserve,
            isAttacker ? payload.forces.attackers.reserve : payload.forces.defenders.reserve);

        split.toUpdate.forEach((data) => reserve.get(data.id)?.update(data));
        split.toAdd.forEach((data) => {
            reserve.set(data.id, new ReserveUnitCard(container, data, isAttacker));
        })
        split.toRemove.forEach((id) => {
            reserve.get(id)?.destroy();
            reserve.delete(id);
        })
    }

    private splitPayload(container: Map<string, unknown>, payload: CombatantSummaryDTO[]): SplitPayload {
        const toAdd: CombatantSummaryDTO[] = [];
        const toRemove: string[] = [];
        const toUpdate: CombatantSummaryDTO[] = [];

        const incomingIds = new Set(payload.map(dto => dto.id));

        payload.forEach((dto) => {
            if (container.has(dto.id)) {
                toUpdate.push(dto);
            } else {
                toAdd.push(dto);
            }
        })

        container.forEach((_, id) => {
            if (!incomingIds.has(id)) {
                toRemove.push(id);
            }
        })

        return { toAdd, toRemove, toUpdate };
    }

    // For external tooltip manager
    public getLatestPayload() {
        return this.latestPayload;
    }

    public getFrame() {
        return this.frame;
    }
}

interface SplitPayload {
    toAdd: CombatantSummaryDTO[];
    toRemove: string[];
    toUpdate: CombatantSummaryDTO[];
}