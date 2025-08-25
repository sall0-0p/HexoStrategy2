import {GameState} from "./core/GameState";
import {ConstructionWindow} from "./ui/construction/ConstructionWindow";
import {Players} from "@rbxts/services";
import {StupidTest} from "./test";
import {TooltipService} from "./ui/generic/tooltip/TooltipService";
import {RichTextComponent} from "./ui/generic/tooltip/components/RichTextComponent";
import {UIStateType} from "./ui/fsm/UIState";
import {UIStateMachine} from "./ui/fsm/UIStateMachine";
import {NormalUIState} from "./ui/fsm/states/NormalState";
import {ResourceUIState} from "./ui/fsm/states/ResourceState";

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

const test = Players.LocalPlayer.WaitForChild("PlayerGui").WaitForChild("Test").WaitForChild("OpenConstruction") as TextButton;
test.MouseButton1Click.Connect(() => {
    new ConstructionWindow();
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

TooltipService.getInstance().bind(test, [
    { class: RichTextComponent, get: () => 'Hello <b><color value="#ffd000">world</color></b> <icon src="rbxassetid://115581448311350"/> <br/>Hello Man, how are you? This is great.'}
]);

// wait(5);
// const ponylandia = NationRepository.getInstance().getById("PNL")!;
// print(ponylandia.getModifiers().getAllModifiers());