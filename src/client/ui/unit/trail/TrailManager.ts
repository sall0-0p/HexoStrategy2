import {Unit} from "../../../systems/unit/Unit";
import {Trail} from "./Trail";
import {ReplicatedStorage} from "@rbxts/services";
import {
    MovementEndedMessage,
    MovementStartedMessage, MovementSubscriptionMessage,
    MovementUpdateMessage, SubscribeRequest, SubscribeResponse, UnsubscribeRequest
} from "../../../../shared/dto/MovementDataSubscription";

const subscriber = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("PathSubscriber") as RemoteFunction;
const subscriptionMessenger = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("PathSubscriptionEvent") as RemoteEvent;

export class TrailManager {
    private trails = new Map<Unit, Trail>;
    private subscribedUnits = new Set<Unit>;

    private static instance: TrailManager;
    private constructor() {
        subscriptionMessenger.OnClientEvent.Connect((payload) => this.onMessage(payload));
    }

    private onMessage(message: MovementSubscriptionMessage) {
        if (message.type === "started") {
            print("STARTED:", message.payload);
        } else if (message.type === "update") {
            print("UPDATED:", message.payload);
        } else if (message.type === "progress") {

        } else if (message.type === "end") {
            print("ENDED:", message.payload);
        }
    }

    public onSelect(units: Unit[]) {
        this.subscribe(units);
    }

    public onDeselect(units: Unit[]) {
        this.unsubscribe(units);
    }

    private subscribe(units: Unit[]) {
        if (units.size() === 0) return;
        const payload: string[] = [];
        units.forEach((unit) => {
            this.subscribedUnits.add(unit);
            payload.push(unit.getId());
        })

        const response: SubscribeResponse = subscriber.InvokeServer({ units: payload } as SubscribeRequest);
    }

    private unsubscribe(units: Unit[]) {
        if (units.size() === 0) return;
        const payload: string[] = [];
        units.forEach((unit) => {
            this.subscribedUnits.delete(unit);
            payload.push(unit.getId());
        })

        subscriptionMessenger.FireServer({ units: payload } as UnsubscribeRequest);
    }

    private onStartMessage(message: MovementStartedMessage) {

    }

    private onUpdateEvent(message: MovementUpdateMessage) {

    }

    private onFinishedMessage(message: MovementEndedMessage) {

    }

    // singleton shenanigans
    private clear() {

    };

    public static resetInstance() {
        if (!this.instance) return;
        this.instance.clear();
        this.instance = undefined!;
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new TrailManager();
        }
        return this.instance;
    }
}