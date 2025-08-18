import {GameState} from "./core/GameState";
import {ConstructionWindow} from "./ui/construction/ConstructionWindow";
import {Players} from "@rbxts/services";
import {StupidTest} from "./test";
import {defaultRegistry, parseRich} from "./ui/generic/tooltip/RichParser";
import {TooltipService} from "./ui/generic/tooltip/TooltipService";
import {RichTextComponent} from "./ui/generic/tooltip/components/RichTextComponent";

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

// Parse
const reg = defaultRegistry();
const tokens = parseRich('Hello <b><color value="#ffd000">world</color></b> <icon name="civ"/>!', reg);
print(tokens);
// // Iterate tokens in order and render them however you like
// for (const t of tokens) {
//     if (t.kind === "text") {
//         // create TextLabel with t.style.bold, t.style.color, t.text
//     } else if (t.kind === "inline" && t.name === "icon") {
//         const name = t.attrs.get("name")!;
//         // create ImageLabel for that icon; baseline-align; t.style is current style
//     } else if (t.kind === "break") {
//         // start new line
//     }
// }

TooltipService.getInstance().bind(test, [
    { class: RichTextComponent, get: () => 'Hello <b><color value="#ffd000">world</color></b> <icon src="rbxassetid://115581448311350"/> <br/>Hello Man, how are you? This is great.'}
]);