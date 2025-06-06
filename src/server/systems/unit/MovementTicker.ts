import {Hex} from "../../world/hex/Hex";
import {Unit} from "./Unit";
import {ReplicatedStorage, RunService} from "@rbxts/services";
import {Signal} from "../../../shared/classes/Signal";
import {
    MovementEndedMessage,
    MovementProgressMessage,
    MovementStartedMessage, MovementUpdateMessage,
    SubscribeRequest,
    SubscribeResponse,
    UnitPathingData,
    UnsubscribeRequest
} from "../../../shared/dto/MovementDataSubscription";
import {UnitRepository} from "./UnitRepository";
import {UnitUpdateMessage} from "../../../shared/dto/UnitReplicatorMessage";

type MovementData = {
    from: Hex,
    to: Hex,
    progress: number,
    finished: Signal<[]>,
}

const subscriber = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("PathSubscriber") as RemoteFunction;
const subscriptionMessenger = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("PathSubscriptionEvent") as RemoteEvent;

export class MovementTicker {
    private unitsInMovement = new Map<Unit, MovementData>;
    private subscriptions = new Map<Player, Set<Unit>>;
    private unitRepository = UnitRepository.getInstance();

    private static instance: MovementTicker;
    private constructor() {
        RunService.Heartbeat.Connect(() => this.onTick());

        subscriber.OnServerInvoke = (player, message) => {
            return this.subscribe(player, message as SubscribeRequest);
        }

        subscriptionMessenger.OnServerEvent.Connect((player, message) => {
            this.unsubscribe(player, message as UnsubscribeRequest);
        })
    }

    private onTick() {
        this.unitsInMovement.forEach((data, unit) => this.tickUnit(unit, data));
        // Add here updates, if tracked.
    }

    private tickUnit(unit: Unit, data: MovementData) {
        if (data.progress > 100) {
            this.finishMovement(unit);
            return;
        }

        data.progress += unit.getTemplate().getSpeed();

        // Update on Progress, towards progress percentage.
        const trackingPlayers = this.getUnitTrackers(unit);
        if (trackingPlayers) {
            const payload = new Map<string, UnitPathingData>;

            const order = unit.getCurrentMovemementOrder();
            if (order) {
                const path = order.path.map((hex) => hex.getId());
                const info = {
                    progress: 0,
                    current: path[0],
                } as UnitPathingData;
                payload.set(unit.getId(), info);
            }

            trackingPlayers.forEach((player) => {
                subscriptionMessenger.FireClient(player, {
                    type: "progress",
                    payload: payload,
                } as MovementProgressMessage);
            });
        }
    };

    public scheduleMovement(unit: Unit, destination: Hex) {
        if (destination === undefined) error("Attempting movement to nil!");
        const data = {
            from: unit.getPosition(),
            to: destination,
            progress: 0,
            finished: new Signal<[]>,
        } as MovementData;

        this.unitsInMovement.set(unit, data);

        return data;
    }

    public scheduleOrder(unit: Unit) {
        const trackingPlayers = this.getUnitTrackers(unit);
        if (trackingPlayers) {
            const payload = new Map<string, UnitPathingData>;

            const order = unit.getCurrentMovemementOrder();
            if (order) {
                const path = order.path.map((hex) => hex.getId());
                const info = {
                    from: order.from.getId(),
                    to: order.to.getId(),
                    path: path,
                    progress: 0,
                    current: path[0],
                } as UnitPathingData;
                payload.set(unit.getId(), info);
            }

            trackingPlayers.forEach((player) => {
                subscriptionMessenger.FireClient(player, {
                    type: "started",
                    payload: payload,
                } as MovementStartedMessage);
            })
        }
    }

    public cancelMovement(unit: Unit) {
        this.unitsInMovement.delete(unit);
    }

    private finishMovement(unit: Unit) {
        const data = this.unitsInMovement.get(unit);
        if (!data) error("Trying to finish unexistent movement!");

        this.unitsInMovement.delete(unit);
        unit.setPosition(data.to);
        data.finished.fire();

        // Update on progress, towards nodes.
        const trackingPlayers = this.getUnitTrackers(unit);
        if (trackingPlayers) {
            const payload = new Map<string, UnitPathingData>;

            const order = unit.getCurrentMovemementOrder();
            if (order) {
                const path = order.path.map((hex) => hex.getId());
                const info = {
                    from: order.from.getId(),
                    to: order.to.getId(),
                    path: path,
                    progress: 0,
                    current: order.current.getId(),
                } as UnitPathingData;
                payload.set(unit.getId(), info);
            }

            trackingPlayers.forEach((player) => {
                if (payload.size() === 0) return;
                subscriptionMessenger.FireClient(player, {
                    type: "update",
                    payload: payload,
                } as UnitUpdateMessage)
            })
        }
    }

    // Subscribing and movement progress streaming.
    private subscribe(player: Player, message: SubscribeRequest): SubscribeResponse {
        if (!this.subscriptions.has(player)) {
            this.subscriptions.set(player, new Set<Unit>());
        }
        const subs = this.subscriptions.get(player)!;

        for (const unitId of message.units) {
            const candidate = this.unitRepository.getById(unitId);
            if (candidate) {
                subs.add(candidate);
            }
        }

        const payload = new Map<string, UnitPathingData>();
        for (const unit of subs) {
            const data = this.unitsInMovement.get(unit);
            const order = unit.getCurrentMovemementOrder();
            if (data && order) {
                const info = {
                    from: order.from.getId(),
                    to: order.to.getId(),
                    path: order.path.map((hex) => hex.getId()),
                    progress: data.progress,
                    current: data.to.getId(),
                } as UnitPathingData;
                payload.set(unit.getId(), info);
            }
        }
        return { payload };
    }

    private unsubscribe(player: Player, message: UnsubscribeRequest) {
        const subs = this.subscriptions.get(player);
        if (subs) {
            for (const unitId of message.units) {
                for (const unit of subs) {
                    if (unit.getId() === unitId) {
                        subs.delete(unit);
                        break;
                    }
                }
            }

            if (subs.size() === 0) {
                this.subscriptions.delete(player);
            }
        }
    }

    public notifyReached(unit: Unit) {
        const trackingPlayers = this.getUnitTrackers(unit);
        if (trackingPlayers) {
            trackingPlayers.forEach((player) => {
                subscriptionMessenger.FireClient(player, {
                    type: "end",
                    payload: [ unit.getId() ],
                } as MovementEndedMessage)
            })
        }
    }

    private getUnitTrackers(unit: Unit): Player[] | undefined {
        const players: Player[] = [];
        for (const [player, subs] of this.subscriptions) {
            if (subs.has(unit)) {
                players.push(player);
            }
        }
        return players.size() > 0 ? players : undefined;
    }


    public static getInstance() {
        if (!this.instance) {
            this.instance = new MovementTicker();
        }

        return this.instance;
    }
}