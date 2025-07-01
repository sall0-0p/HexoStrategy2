import {BattleRepository} from "./BattleRepository";
import {TimeSignalType, WorldTime} from "../time/WorldTime";
import {ReplicatedStorage} from "@rbxts/services";
import {BattleSummaryDTO} from "../../../shared/dto/BattleDTO";

const replicator = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("BattleReplicator") as RemoteEvent;

export class BattleReplicator {
    private worldTime = WorldTime.getInstance();
    private battleRepository = BattleRepository.getInstance();
    private static instance: BattleReplicator;
    private constructor() {}

    public onTick() {
        const battles = this.battleRepository.getAllBattles();
        const payload: BattleSummaryDTO[] = [];

        battles.forEach((battle) => payload.push(battle.toSummaryDTO()));

        replicator.FireAllClients(payload);
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new BattleReplicator();
        }

        return this.instance;
    }
}