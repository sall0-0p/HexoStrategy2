import {GameState} from "./core/GameState";
import {ReplicatedStorage} from "@rbxts/services";
import {BattleSummaryDTO} from "../shared/dto/BattleDTO";

declare global {
    interface _G {
        activeNationId: string,
    }
}

print("Getting GameState");
const gameState = GameState.getInstance();
print("Selecting PNL");
gameState.switchNation("PNL");