import {Players, ReplicatedStorage, TweenService} from "@rbxts/services";
import {UIStateMachine} from "../fsm/UIStateMachine";
import {UIStateType} from "../fsm/UIState";
import {NormalUIState} from "../fsm/states/NormalState";
import {Nation} from "../../world/nation/Nation";
import {NationRepository} from "../../world/nation/NationRepository";
import {NationEquipmentComponent} from "../../systems/equipment/NationEquipmentComponent";
import {ArchetypeCard} from "./ArchetypeCard";
import {EquipmentArchetype} from "../../../shared/constants/EquipmentArchetype";

const template = ReplicatedStorage.WaitForChild("Assets")
    .WaitForChild("UI")
    .WaitForChild("Stockpile")
    .WaitForChild("Main") as Frame;

const container = Players.LocalPlayer.WaitForChild("PlayerGui")
    .WaitForChild("Windows")
    .WaitForChild("StockpileWindow") as ScreenGui;

export class StockpileWindow {
    private frame: Frame;
    private nation: Nation;
    private equipment: NationEquipmentComponent;

    private cards: Map<EquipmentArchetype, ArchetypeCard> = new Map();

    public constructor() {
        this.frame = template.Clone();
        this.frame.Parent = container;
        this.nation = NationRepository.getInstance().getById(_G.activeNationId)!;
        this.equipment = this.nation.getEquipment();

        this.populateCards();
        this.open();

        const connection1 = this.equipment.changed.connect(() => this.populateCards());

        const close = this.frame.WaitForChild("Header").WaitForChild("Close") as TextButton;
        const connection2 = close.MouseButton1Click.Connect(() => this.close());

        this.frame.Destroying.Once(() => {
            connection1.disconnect();
            connection2.Disconnect();
        })
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

    private populateCards() {
        const stockpile = this.equipment.getStockpile().getStockpile();
        stockpile.forEach((_, a) => {
            if (!this.cards.has(a)) {
                this.cards.set(a, new ArchetypeCard(this, a));
            }
        });

        this.cards.forEach((c) => c.update());
    }

    private close() {
        const tween = TweenService.Create(this.frame, new TweenInfo(0.5, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
            Position: new UDim2(-1, -8, 0.11, 0),
        });

        tween.Play();
        tween.Completed.Once(() =>
            this.destroy());
    }

    private destroy() {
        this.frame.Destroy();
    }

    public getNation() { return this.nation; }
    public getFrame() { return this.frame; }
}