import {Hex} from "../../world/hex/Hex";
import {Unit} from "./Unit";
import {RunService} from "@rbxts/services";
import {Signal} from "../../../shared/classes/Signal";

type MovementData = {
    from: Hex,
    to: Hex,
    progress: number,
    finished: Signal<[]>,
}

export class MovementTicker {
    private unitsInMovement = new Map<Unit, MovementData>;

    private static instance: MovementTicker;
    private constructor() {
        RunService.Heartbeat.Connect(() => this.onTick());
    }

    private onTick() {
        this.unitsInMovement.forEach((data, unit) => this.tickUnit(unit, data));
    }

    private tickUnit(unit: Unit, data: MovementData) {
        if (data.progress > 100) {
            this.finishMovement(unit);
            return;
        }

        data.progress += unit.getTemplate().getSpeed();
    };

    public scheduleMovement(unit: Unit, destination: Hex) {
        const data = {
            from: unit.getPosition(),
            to: destination,
            progress: 0,
            finished: new Signal<[]>,
        } as MovementData;

        this.unitsInMovement.set(unit, data);
        return data;
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
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new MovementTicker();
        }

        return this.instance;
    }
}