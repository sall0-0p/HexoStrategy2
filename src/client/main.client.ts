import {GameState} from "./core/GameState";

declare global {
    interface _G {
        activeNationId: string,
    }
}

print("Getting GameState");
const gameState = GameState.getInstance();
print("Selecting PNL");
gameState.switchNation("PNL");