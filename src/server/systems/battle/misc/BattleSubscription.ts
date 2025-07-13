// src/network/BattleSubscriptionManager.ts
import { ReplicatedStorage } from "@rbxts/services";
import { ControlPayload, BattleEnded, BattleUpdate } from "../../../../shared/network/battle/Subscription";
import { BattleRepository } from "./BattleRepository";

const event = ReplicatedStorage
    .WaitForChild("Events")
    .WaitForChild("BattleSubscriptionEvent") as RemoteEvent;

export class BattleSubscription {
    private subscriptions = new Map<Player, Set<string>>();

    constructor() {
        // control channel: subscribe / unsubscribe requests from clients
        event.OnServerEvent.Connect((player: Player, payload: unknown) => {
            switch ((payload as ControlPayload).type) {
                case "subscribe":
                    this.subscribe(player, (payload as ControlPayload).battleId);

                    // Transmit first message to shorten load times.
                    const battle = BattleRepository.getInstance().getById((
                        (payload as ControlPayload).battleId));
                    if (!battle) return;
                    event.FireClient(player, battle.toSubscriptionEvent());

                    break;
                case "unsubscribe":
                    this.unsubscribe(player, (payload as ControlPayload).battleId);
                    break;
            }
        });
    }

    private subscribe(player: Player, battleId: string) {
        let battles = this.subscriptions.get(player);
        if (!battles) {
            battles = new Set<string>();
            this.subscriptions.set(player, battles);
        }

        // already subscribed?
        if (battles.has(battleId)) {
            return;
        }
        battles.add(battleId);

        const battle = BattleRepository.getInstance().getById((battleId));
        if (!battle) {
            warn(`Player ${player.Name} tried to subscribe to unknown battle ${battleId}`);
            return;
        }

        // when battle ends, notify this player
        battle.onBattleEnded.connect(() => {
            const endedEvent: BattleEnded = {
                type: "ended",
                battleId,
            };
            event.FireClient(player, endedEvent);
        });
    }

    private unsubscribe(player: Player, battleId: string) {
        const battles = this.subscriptions.get(player);
        if (!battles || !battles.has(battleId)) {
            return;
        }
        battles.delete(battleId);
        // TODO: disconnect any event listeners if you stored them
    }

    public onTick() {
        this.subscriptions.forEach((sub, plr) => {
            sub.forEach((battleId) => {
                const battle = BattleRepository.getInstance().getById((battleId));
                if (!battle) return;
                event.FireClient(plr, battle.toSubscriptionEvent());
            })
        })
    }

    public getSubscribedBattles(player: Player): string[] {
        const battles = this.subscriptions.get(player);
        return battles ? [...battles] : [];
    }
}
