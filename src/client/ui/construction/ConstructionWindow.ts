import {Building} from "../../../shared/data/ts/BuildingDefs";
import {Players, ReplicatedStorage, TweenService} from "@rbxts/services";
import {
    ConstructionEmitter,
    CurrentProject,
    MessageData,
    MessageType
} from "../../../shared/tether/messages/Construction";
import {ConstructionCard} from "./ConstructionCard";
import {UIStateMachine} from "../fsm/UIStateMachine";
import {UIStateType} from "../fsm/UIState";
import {NormalUIState} from "../fsm/states/NormalState";
import {BuildingCard} from "./BuildingCard";
import {TooltipService} from "../generic/tooltip/TooltipService";
import {RichTextComponent} from "../generic/tooltip/components/RichTextComponent";
import {NationRepository} from "../../world/nation/NationRepository";
import {ModifiableProperty} from "../../../shared/classes/ModifiableProperty";
import {HeaderComponent} from "../generic/tooltip/components/HeaderComponent";
import {SeparatorComponent} from "../generic/tooltip/components/SeparatorComponent";
import {TooltipDelay} from "../../../shared/config/TooltipDelay";
import {TextComponent} from "../generic/tooltip/components/TextComponent";
import {Modifier} from "../../../shared/classes/Modifier";
import {ModifierContainer} from "../../systems/modifier/ModifierContainer";
import {Definition} from "../../../shared/config/Definition";

const template = ReplicatedStorage
    .WaitForChild("Assets")
    .WaitForChild("UI")
    .WaitForChild("Construction")
    .WaitForChild("Main") as Frame;

const location = Players.LocalPlayer.WaitForChild("PlayerGui")
    .WaitForChild("Windows")
    .WaitForChild("ConstructionWindow") as ScreenGui;

export class ConstructionWindow {
    private frame: Frame;
    private cards: ConstructionCard[] = [];
    private fetching: boolean = false;

    constructor(building?: Building) {
        this.frame = template.Clone();
        this.frame.Parent = location;

        this.populateAvailableBuildings();
        this.fetchConstructions();
        this.open();

        // Binding events:
        const conn1 = ConstructionEmitter.client.on(MessageType.ConstructionProgressUpdate, (p) => this.onUpdate(p));
        const conn2 = ConstructionEmitter.client.on(MessageType.ProjectFinishedUpdate, (p) => this.onFinished(p));
        this.frame.Destroying.Connect(() => {
            conn1();
            conn2();
        })

        // Binding close button
        const close = this.frame.WaitForChild("Header").WaitForChild("Close") as TextButton;
        close.MouseButton1Click.Connect(() => this.close());

        this.addBuildSpeedLabel();
    }

    private open() {
        const uiStateMachine = UIStateMachine.getInstance();
        const uiState = uiStateMachine.getCurrentState()?.type;
        if (uiState !== UIStateType.Normal) {
            uiStateMachine.changeTo(new NormalUIState());
        }

        TweenService.Create(this.frame, new TweenInfo(0.5, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
            Position: new UDim2(0, -8, 0.11, 0),
        }).Play();
    }

    public close() {
        const uiStateMachine = UIStateMachine.getInstance();
        const uiState = uiStateMachine.getCurrentState()?.type;
        if (uiState === UIStateType.RegionConstruction || uiState === UIStateType.HexConstruction) {
            uiStateMachine.changeTo(new NormalUIState());
        }

        const tween = TweenService.Create(this.frame, new TweenInfo(0.5, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
            Position: new UDim2(-1, -8, 0.11, 0),
        });

        tween.Play();
        tween.Completed.Once(() =>
            this.destroy());
    }

    public destroy() {
        this.frame.Destroy();
    }

    private onUpdate(payload: MessageData[MessageType.ConstructionProgressUpdate]) {
        const card = this.cards.find((c) => payload.constructionId === c.getId());
        if (!card) {
            this.fetchConstructions();
            return;
        }

        card.update(payload);
    }

    private onFinished(payload: MessageData[MessageType.ProjectFinishedUpdate]) {
        const cardIndex = this.cards.findIndex((c) => payload.constructionId === c.getId());
        const card = this.cards[cardIndex];
        if (!card || cardIndex === -1) error(`Failed to update card ${payload.constructionId}`);

        card.destroy();
        this.cards.remove(cardIndex);
        this.cards.forEach((c, i) => c.setPosition(i))
    }

    private populateAvailableBuildings() {
        for (const [id, building] of pairs(Building)) {
            new BuildingCard(building, this);
        }
    }

    private fetchConstructions() {
        if (this.fetching) return;

        this.fetching = true;
        const promise = ConstructionEmitter.server.invoke(
            MessageType.GetCurrentQueueRequest,
            MessageType.GetCurrentQueueResponse,
            {}
        );

        promise.then((payload) => {
            this.fetching = false;
            if (payload.success && payload.data) {
                this.populateConstructions(payload.data);
            } else {
                warn("Failed to retrieve info!");
                return;
            }
        })
    }

    private populateConstructions(data: CurrentProject[]) {
        const container = this.frame.WaitForChild("Body")
            .WaitForChild("Center")
            .WaitForChild("List")
            .WaitForChild("Container") as ScrollingFrame;

        data.forEach((item: CurrentProject, index) => {
            if (this.cards.find((c) => c.id === item.id)) return;

            const card = new ConstructionCard(container, index, item,
                // Move
                (toIndex) => {
                    const cards = this.cards;
                    const from = card.getPosition();
                    const len  = cards.size();
                    const last = len - 1;

                    let target = toIndex;
                    if (target < 0)       target = 0;
                    if (target > last)    target = last;
                    if (target === from)  return;   // no move

                    const moving = cards[from];

                    if (target < from) {
                        for (let i = from; i > target; i--) {
                            cards[i] = cards[i - 1];
                        }
                    } else {
                        for (let i = from; i < target; i++) {
                            cards[i] = cards[i + 1];
                        }
                    }

                    cards[target] = moving;
                    cards.forEach((c, i) => c.setPosition(i));
            });
            this.cards.push(card);
        })
    }

    private updateBuildSpeedLabel(container: ModifierContainer) {
        const label = this.frame.WaitForChild("Body")
            .WaitForChild("Center")
            .WaitForChild("Header")
            .WaitForChild("Right")
            .WaitForChild("Container")
            .WaitForChild("TextLabel") as TextLabel;

        const base = Definition.BaseFactoryConstructionOutput;
        const effective = container.getEffectiveValue(base, [ModifiableProperty.GlobalBuildSpeed]);
        const value = math.round(((effective / base) - 1) * 100);
        const plus = (value > 0) ? `+` : ``
        label.Text = plus + tostring(value) + '%';

        if (value > 0) {
            label.TextColor3 = Color3.fromRGB(83, 193, 86);
        } else if (value < 0) {
            label.TextColor3 = Color3.fromRGB(255, 73, 66);
        } else {
            label.TextColor3 = Color3.fromRGB(255, 203, 54);
        }
    }

    private addBuildSpeedLabel() {
        const nation = NationRepository.getInstance().getById(_G.activeNationId);
        if (!nation) return;

        const modifiers = nation.getModifiers();
        const headerBuildSpeed = this.frame.WaitForChild("Body")
            .WaitForChild("Center")
            .WaitForChild("Header")
            .WaitForChild("Right")
            .WaitForChild("Container") as Frame;

        const conn = modifiers.updated.connect(() => this.updateBuildSpeedLabel(modifiers));
        this.frame.Destroying.Once(() => conn.disconnect());
        this.updateBuildSpeedLabel(modifiers);

        TooltipService.getInstance().bind(headerBuildSpeed, [
            { class: HeaderComponent, get: () => ({ text: "Construction Speed"})},
            { class: RichTextComponent, get: () => {
                return modifiers.getModifierBreakdown(ModifiableProperty.GlobalBuildSpeed);
            },
                if: () =>
                    modifiers.getModifiersForProperty(ModifiableProperty.GlobalBuildSpeed).size() > 0
            },
            { class: SeparatorComponent, delay: TooltipDelay.MoreInfo },
            { class: TextComponent, delay: TooltipDelay.MoreInfo, get: () =>
                    ({ text: "Speed at which buildings are constructed."})
            },
        ])
    }

    public getFrame() { return this.frame };
}