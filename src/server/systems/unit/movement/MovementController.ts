import { Hex } from "../../../world/hex/Hex";
import { MovementTicker } from "./MovementTicker";
import { Connection, Signal } from "../../../../shared/classes/Signal";
import { DiplomaticRelationStatus } from "../../diplomacy/DiplomaticRelation";
import {Unit} from "../Unit";

export interface ActiveMovementOrder {
    to: Hex;
    from: Hex;
    path: Hex[];
    current: Hex;
    cancel(): void;
}

export class MovementController {
    public readonly order: ActiveMovementOrder;
    private stepIndex = 0;
    private connection?: Connection;
    private cancelled = false;

    constructor(
        private unit: Unit,
        path: Hex[],
        private ticker: MovementTicker
    ) {
        this.order = {
            to: path[path.size() - 1],
            from: path[0],
            path,
            current: path[0],
            cancel: () => this.cancel()
        };
    }

    public start(): ActiveMovementOrder {
        this.ticker.scheduleOrder(this.unit);
        this.nextStep();
        return this.order;
    }

    private nextStep() {
        if (this.cancelled || this.stepIndex >= this.order.path.size()) {
            this.order.cancel = () => {};
            this.ticker.notifyReached(this.unit);
            return;
        }

        const nextHex = this.order.path[this.stepIndex];
        const data = this.ticker.scheduleMovement(this.unit, nextHex);

        this.connection = data.finished.connect(() => {
            this.connection!.disconnect();
            this.claim(nextHex);
            this.order.current = nextHex;
            this.stepIndex++;
            this.nextStep();
        });
    }

    private claim(hex: Hex) {
        const owner = this.unit.getOwner();
        const rels = owner.getRelations();
        const hexOwner = hex.getOwner();
        if (
            !hexOwner ||
            rels.get(hexOwner.getId())?.status === DiplomaticRelationStatus.Enemy
        ) {
            hex.setOwner(owner);
        }
    }

    private cancel() {
        this.cancelled = true;
        this.ticker.cancelMovement(this.unit);
        this.connection?.disconnect();
    }
}
