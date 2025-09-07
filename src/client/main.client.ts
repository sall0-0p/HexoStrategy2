import {GameState} from "./core/GameState";
import {ConstructionWindow} from "./ui/construction/ConstructionWindow";
import {Players, ReplicatedStorage} from "@rbxts/services";
import {StupidTest} from "./test";
import {TooltipService} from "./ui/generic/tooltip/TooltipService";
import {RichTextComponent} from "./ui/generic/tooltip/components/RichTextComponent";
import {UIStateType} from "./ui/fsm/UIState";
import {UIStateMachine} from "./ui/fsm/UIStateMachine";
import {NormalUIState} from "./ui/fsm/states/NormalState";
import {ResourceUIState} from "./ui/fsm/states/ResourceState";
import {EquipmentTypeRepository} from "./systems/equipment/type/EquipmentTypeRepository";
import {NationRepository} from "./world/nation/NationRepository";
import {StockpileWindow} from "./ui/stockpile/StockpileWindow";

declare global {
    interface _G {
        activeNationId: string,
    }
}

print("Getting GameState");
const gameState = GameState.getInstance();
print("Selecting PNL");
gameState.switchNation("PNL");
StupidTest.test();

const constructions = Players.LocalPlayer.WaitForChild("PlayerGui").WaitForChild("Test").WaitForChild("OpenConstruction") as TextButton;
constructions.MouseButton1Click.Connect(() => {
    new ConstructionWindow();
});

const stockpiles = Players.LocalPlayer.WaitForChild("PlayerGui").WaitForChild("Test").WaitForChild("OpenStockpile") as TextButton;
stockpiles.MouseButton1Click.Connect(() => {
    new StockpileWindow();
});

const resourceTest = Players.LocalPlayer.WaitForChild("PlayerGui").WaitForChild("Test").WaitForChild("Resources") as TextButton;
resourceTest.MouseButton1Click.Connect(() => {
    const uiStateMachine = UIStateMachine.getInstance();
    if (uiStateMachine.getCurrentState()?.type === UIStateType.ResourceState) {
        uiStateMachine.changeTo(new NormalUIState());
    } else {
        uiStateMachine.changeTo(new ResourceUIState());
    }
})

wait(5);
print(EquipmentTypeRepository.getInstance().getAll());

// const eventStockpile = ReplicatedStorage.WaitForChild("Events").WaitForChild("StockpileReplicator") as RemoteEvent;
// eventStockpile.OnClientEvent.Connect((d: unknown) => print("StockpileReplicator", d));

const eventReservation = ReplicatedStorage.WaitForChild("Events").WaitForChild("ReservationReplicator") as RemoteEvent;
eventReservation.OnClientEvent.Connect((d: unknown) => print("ReservationReplicator:", d));

wait(5);
print(NationRepository.getInstance().getById("PNL")!.getEquipment());