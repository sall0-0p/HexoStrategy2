import { Hex } from "../../world/hex/Hex";
import { Unit } from "./Unit";
import { RunService } from "@rbxts/services";
import { Signal } from "../../../shared/classes/Signal";
import { UnitRepository } from "./UnitRepository";
import { MovementSubscriptionManager } from "./MovementSubscriptionManager";

type MovementData = {
    from: Hex;
    to: Hex;
    progress: number;
    finished: Signal<[]>;
};

export class MovementTicker {
    private unitsInMovement = new Map<Unit, MovementData>();
    private movementSubscriptionManager;

    private static instance: MovementTicker;
    private constructor() {
        this.movementSubscriptionManager = new MovementSubscriptionManager(this);
        RunService.Heartbeat.Connect(() => this.onTick());
    }

    private onTick() {
        this.unitsInMovement.forEach((data, unit) => {
            this.tickUnit(unit, data);
            this.movementSubscriptionManager.recordProgress(unit, data.progress);
        });

        this.movementSubscriptionManager.flushProgress();
    }

    private tickUnit(unit: Unit, data: MovementData) {
        if (data.progress > 100) {
            this.finishMovement(unit);
            return;
        }

        // Hexes Per Second = Speed * 0.06
        data.progress += unit.getTemplate().getSpeed() / 10;
    }

    public scheduleMovement(unit: Unit, destination: Hex) {
        if (destination === undefined) error("Attempting movement to nil!");
        const data: MovementData = {
            from: unit.getPosition(),
            to: destination,
            progress: 0,
            finished: new Signal<[]>(),
        };

        this.unitsInMovement.set(unit, data);
        return data;
    }

    public scheduleOrder(unit: Unit) {
        this.movementSubscriptionManager.recordStarted(unit);
    }

    public cancelMovement(unit: Unit) {
        print("Cancel Movement Called!");
        this.unitsInMovement.delete(unit);
        this.movementSubscriptionManager.recordEnd(unit);
    }

    private finishMovement(unit: Unit) {
        const data = this.unitsInMovement.get(unit);
        if (!data) error("Trying to finish unexistent movement!");

        this.unitsInMovement.delete(unit);
        unit.setPosition(data.to);
        data.finished.fire();

        this.movementSubscriptionManager.recordUpdate(unit);
    }

    public notifyReached(unit: Unit) {
        this.movementSubscriptionManager.recordEnd(unit);
    }

    public getMovementInfo(unit: Unit): {
        from: string;
        to: string;
        path: string[];
        progress: number;
        current: string;
    } | undefined {
        const data = this.unitsInMovement.get(unit);
        const order = unit.getCurrentMovemementOrder();
        if (!data || !order) return undefined;

        return {
            from: order.from.getId(),
            to: order.to.getId(),
            path: order.path.map((hex) => hex.getId()),
            progress: data.progress,
            current: order.current.getId(),
        };
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new MovementTicker();
        }
        return this.instance;
    }
}
