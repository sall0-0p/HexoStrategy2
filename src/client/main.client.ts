import {GameState} from "./core/GameState";
import {ConstructionWindow} from "./ui/construction/ConstructionWindow";
import {Players} from "@rbxts/services";
import {ConstructionEmitter, MessageType} from "../shared/tether/messages/Construction";
import {StupidTest} from "./test";

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