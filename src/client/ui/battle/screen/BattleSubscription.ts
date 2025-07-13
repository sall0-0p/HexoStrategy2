import {Signal} from "../../../../shared/classes/Signal";
import {BattlePayload, BattleUpdate, ControlPayload} from "../../../../shared/network/battle/Subscription";
import {ReplicatedStorage} from "@rbxts/services";

const event = ReplicatedStorage
    .WaitForChild("Events")
    .WaitForChild("BattleSubscriptionEvent") as RemoteEvent;

export class BattleSubscription {
    private battleId: string;

    public updated: Signal<[BattleUpdate]> = new Signal();
    public ended: Signal<[]> = new Signal();

    public constructor(battleId: string) {
        this.battleId = battleId;

        event.FireServer({
            type: "subscribe",
            battleId,
        } as ControlPayload)

        event.OnClientEvent.Connect((payload: BattlePayload) => {
            if (payload.type === "update") {
                this.updated.fire(payload as BattleUpdate);
            } else {
                this.ended.fire();
                this.cancel();
            }
        })
    }

    public cancel() {
        event.FireServer({
            type: "unsubscribe",
            battleId: this.battleId,
        } as ControlPayload)

        this.ended.clear();
        this.updated.clear();
    }
}