import {Order, OrderType} from "./Order";
import {Connection, Signal} from "../../../../shared/classes/Signal";
import {Hex} from "../../../world/hex/Hex";
import {Unit} from "../Unit";
import {MovementTicker} from "../movement/MovementTicker";
import {DiplomaticRelationStatus} from "../../diplomacy/DiplomaticRelation";
import {MovementPathfinder} from "../movement/MovementPathfinder";

export class MovementOrder implements Order {
    private movementTicker = MovementTicker.getInstance();

    public type = OrderType.Movement;
    public readonly finished = new Signal<[]>();
    private isCancelled = false;
    private stepIndex = 1;
    private currentConnection?: Connection;
    private path: Hex[] = [];
    private from?: Hex;

    constructor(
        private readonly unit: Unit,
        private readonly to: Hex,
        public readonly retreating = false
    ) {}

    public execute() {
        this.from = this.unit.getPosition();
        const candidate = MovementPathfinder.findPath(this.unit, this.from, this.to);
        if (!candidate) return;
        this.path = candidate;

        this.movementTicker.scheduleOrder(this.unit);
        this.advanceStep();
    }

    public cancel() {
        this.isCancelled = true;
        this.movementTicker.cancelMovement(this.unit);
        if (this.currentConnection) {
            this.currentConnection.disconnect();
            this.currentConnection = undefined;
        }
    }

    public getPath() {
        return this.path;
    }

    public getSource() {
        return this.from;
    }

    public getDestination() {
        return this.to;
    }

    public getCurrentHex() {
        const idx = math.max(0, this.stepIndex - 1);
        return this.path[idx];
    }

    private advanceStep() {
        if (this.isCancelled || this.stepIndex >= this.path.size()) {
            this.finished.fire();
            this.movementTicker.notifyReached(this.unit);
            return;
        }

        const nextHex = this.path[this.stepIndex];
        const data = this.movementTicker.scheduleMovement(this.unit, nextHex);

        this.currentConnection = data.finished.connect(() => {
            this.currentConnection!.disconnect();
            this.currentConnection = undefined;

            // auto‐capture
            const rels = this.unit.getOwner().getRelations();
            if (!nextHex.getOwner() ||
                rels.getRelationStatus(nextHex.getOwner()!) === DiplomaticRelationStatus.Enemy
            ) {
                nextHex.setOwner(this.unit.getOwner());
            }

            this.stepIndex++;
            this.advanceStep();
        });
    }
}