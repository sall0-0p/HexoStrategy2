import {GameState} from "./core/GameState";

declare global {
    interface _G {
        activeNationId: string,
    }
}

print("Getting GameState")
const gameState = GameState.getInstance();
print("Selecting PNL")
gameState.switchNation("PNL");

wait(5);
print("Switching to Byrdlands!");
gameState.switchNation("BRD");

wait(3);
print("Switching to Ponylandia!");
gameState.switchNation("PNL");