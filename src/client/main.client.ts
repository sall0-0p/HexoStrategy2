import {GameState} from "./core/GameState";
import {ReplicatedStorage, StarterGui} from "@rbxts/services";
import {BattleSummaryDTO} from "../shared/network/battle/DTO";
import {TooltipService} from "./ui/generic/tooltip/TooltipService";
import {DefaultWorldTooltip} from "./ui/generic/tooltip/world/DefaultWorldTooltip";

declare global {
    interface _G {
        activeNationId: string,
    }
}

print("Getting GameState");
const gameState = GameState.getInstance();
print("Selecting PNL");
gameState.switchNation("PNL");
TooltipService.getInstance().setWorldFetcher(DefaultWorldTooltip.get);

StarterGui.SetCore("TopbarEnabled", false);
StarterGui.SetCoreGuiEnabled("All", false);