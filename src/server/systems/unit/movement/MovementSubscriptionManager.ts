import { ReplicatedStorage, RunService } from "@rbxts/services";
import {
    MovementEndedMessage,
    MovementProgressMessage,
    MovementStartedMessage,
    MovementUpdateMessage,
    SubscribeRequest,
    SubscribeResponse,
    UnitPathingData,
    UnsubscribeRequest,
} from "../../../../shared/dto/MovementDataSubscription";
import { Unit } from "../Unit";
import { UnitRepository } from "../UnitRepository";
import { MovementTicker } from "./MovementTicker";
import { OrderType } from "../order/Order";
import { MovementOrder } from "../order/MovementOrder";

const subscriber = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("PathSubscriber") as RemoteFunction;
const unsubscriber = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("PathUnsubscriber") as RemoteFunction;
const subscriptionMessenger = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("PathSubscriptionEvent") as RemoteEvent;

export class MovementSubscriptionManager {
    private subscriptions = new Map<Player, Set<Unit>>();

    private startedPayloads = new Map<Player, Map<string, UnitPathingData>>();
    private progressPayloads = new Map<Player, Map<string, Partial<UnitPathingData>>>();
    private updatePayloads = new Map<Player, Map<string, UnitPathingData>>();
    private endPayloads = new Map<Player, string[]>();
    private movementTicker: MovementTicker;

    constructor(movementTicker: MovementTicker) {
        this.movementTicker = movementTicker;
        RunService.Heartbeat.Connect(() => {
            this.flushEnd();
            this.flushStarted();
            this.flushUpdate();
            this.flushProgress();
        });

        subscriber.OnServerInvoke = (player, rawMessage) => {
            const message = rawMessage as SubscribeRequest;
            return this.subscribe(player, message);
        };

        unsubscriber.OnServerInvoke = (player, rawMessage) => {
            const message = rawMessage as UnsubscribeRequest;
            this.unsubscribe(player, message);
        };
    }

    public subscribe(player: Player, message: SubscribeRequest): SubscribeResponse {
        if (!this.subscriptions.has(player)) {
            this.subscriptions.set(player, new Set<Unit>());
        }
        const subs = this.subscriptions.get(player)!;

        for (const unitId of message.units) {
            const maybeUnit = UnitRepository.getInstance().getById(unitId);
            if (maybeUnit) {
                subs.add(maybeUnit);
            }
        }

        const payload = new Map<string, UnitPathingData>();
        for (const unit of subs) {
            const info = this.movementTicker.getMovementInfo(unit);
            if (info) {
                payload.set(unit.getId(), {
                    from: info.from,
                    to: info.to,
                    path: info.path,
                    progress: info.progress,
                    current: info.current,
                });
            }
        }

        return { payload };
    }

    public unsubscribe(player: Player, message: UnsubscribeRequest): void {
        const subs = this.subscriptions.get(player);
        if (!subs) return;

        for (const unitId of message.units) {
            for (const u of subs) {
                if (u.getId() === unitId) {
                    subs.delete(u);
                    break;
                }
            }
        }

        if (subs.size() === 0) {
            this.subscriptions.delete(player);
        }
    }

    public recordStarted(unit: Unit): void {
        const order = unit.getOrderQueue().getCurrent();
        if (!order || order.type !== OrderType.Movement) return;
        const movementOrder = order as MovementOrder;

        const pathIds = movementOrder.getPath().map((hex) => hex.getId());
        const info: UnitPathingData = {
            from: movementOrder.getSource()?.getId() ?? "H001",
            to: movementOrder.getDestination().getId(),
            path: pathIds,
            progress: 0,
            current: pathIds[0],
        };

        const trackers = this.getUnitTrackers(unit);
        if (!trackers) return;

        for (const player of trackers) {
            if (!this.startedPayloads.has(player)) {
                this.startedPayloads.set(player, new Map<string, UnitPathingData>());
            }
            this.startedPayloads.get(player)!.set(unit.getId(), info);
        }
    }

    public recordProgress(unit: Unit, dataProgress: number): void {
        const order = unit.getOrderQueue().getCurrent();
        if (!order || order.type !== OrderType.Movement) return;
        const movementOrder = order as MovementOrder;

        const pathIds = movementOrder.getPath().map((hex) => hex.getId());
        const info: Partial<UnitPathingData> = {
            progress: dataProgress,
            current: pathIds[0],
        };

        const trackers = this.getUnitTrackers(unit);
        if (!trackers) return;

        for (const player of trackers) {
            if (!this.progressPayloads.has(player)) {
                this.progressPayloads.set(player, new Map<string, Partial<UnitPathingData>>());
            }
            this.progressPayloads.get(player)!.set(unit.getId(), info);
        }
    }

    public recordUpdate(unit: Unit): void {
        const order = unit.getOrderQueue().getCurrent();
        if (!order || order.type !== OrderType.Movement) return;
        const movementOrder = order as MovementOrder;

        const pathIds = movementOrder.getPath().map((hex) => hex.getId());
        const info: UnitPathingData = {
            from: movementOrder.getSource()?.getId() ?? "H001",
            to: movementOrder.getDestination().getId(),
            path: pathIds,
            progress: 0,
            current: movementOrder.getCurrentHex().getId(),
        };

        const trackers = this.getUnitTrackers(unit);
        if (!trackers) return;

        for (const player of trackers) {
            if (!this.updatePayloads.has(player)) {
                this.updatePayloads.set(player, new Map<string, UnitPathingData>());
            }
            this.updatePayloads.get(player)!.set(unit.getId(), info);
        }
    }

    public recordEnd(unit: Unit): void {
        const trackers = this.getUnitTrackers(unit);
        if (!trackers) return;

        for (const player of trackers) {
            if (!this.endPayloads.has(player)) {
                this.endPayloads.set(player, []);
            }
            this.endPayloads.get(player)!.push(unit.getId());
        }
    }

    private getUnitTrackers(unit: Unit): Player[] | undefined {
        const result: Player[] = [];
        for (const [plr, subs] of this.subscriptions) {
            if (subs.has(unit)) {
                result.push(plr);
            }
        }
        return result.size() > 0 ? result : undefined;
    }

    private flushStarted(): void {
        if (this.startedPayloads.size() === 0) return;

        for (const [player, payload] of this.startedPayloads) {
            subscriptionMessenger.FireClient(player, {
                type: "started",
                payload: payload,
            } as MovementStartedMessage);
        }
        this.startedPayloads.clear();
    }

    public flushProgress(): void {
        if (this.progressPayloads.size() === 0) return;

        for (const [player, payload] of this.progressPayloads) {
            subscriptionMessenger.FireClient(player, {
                type: "progress",
                payload: payload,
            } as MovementProgressMessage);
        }
        this.progressPayloads.clear();
    }

    private flushUpdate(): void {
        if (this.updatePayloads.size() === 0) return;

        for (const [player, payload] of this.updatePayloads) {
            subscriptionMessenger.FireClient(player, {
                type: "update",
                payload: payload,
            } as MovementUpdateMessage);
        }
        this.updatePayloads.clear();
    }

    private flushEnd(): void {
        if (this.endPayloads.size() === 0) return;

        for (const [player, unitIds] of this.endPayloads) {
            subscriptionMessenger.FireClient(player, {
                type: "end",
                payload: unitIds,
            } as MovementEndedMessage);
        }
        this.endPayloads.clear();
    }
}
