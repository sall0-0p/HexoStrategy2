import {EquipmentArchetype} from "../../../shared/constants/EquipmentArchetype";
import {EquipmentType} from "./type/EquipmentType";
import {EquipmentStockpile} from "./EquipmentStockpile";

export class EquipmentReservation {
    private needed: Map<EquipmentArchetype, number>;
    private delivered: Map<EquipmentArchetype, number> = new Map();
    private onDeliver?: (payload: Map<EquipmentType, number>) => void;
    private onComplete?: () => void;

    constructor(
        requirements: Map<EquipmentArchetype, number>,
        onDeliver?: (payload: Map<EquipmentType, number>) => void,
        onComplete?: () => void
    ) {
        this.needed = requirements;
        this.onDeliver = onDeliver;
        this.onComplete = onComplete;
        requirements.forEach((_, a) => this.delivered.set(a, 0));
    }

    /** Try to fulfill part of this reservation from national stockpile */
    public deliverFrom(stockpile: EquipmentStockpile) {
        const payload = new Map<EquipmentType, number>();

        this.needed.forEach((need, archetype) => {
            const deliveredSoFar = this.delivered.get(archetype) ?? 0;
            const remaining = need - deliveredSoFar;

            if (remaining > 0) {
                const taken = stockpile.takeEquipmentForArchetype(archetype, remaining);
                let deliveredCount = 0;
                taken.forEach((n, t) => {
                    deliveredCount += n;
                    payload.set(t, (payload.get(t) ?? 0) + n);
                });

                if (deliveredCount > 0) {
                    this.delivered.set(archetype, deliveredSoFar + deliveredCount);
                }
            }
        });

        if (payload.size() > 0 && this.onDeliver) {
            this.onDeliver(payload); // tell the consumer what actually arrived
        }

        if (this.isComplete() && this.onComplete) {
            this.onComplete();
            this.onComplete = undefined;
        }
    }

    public isComplete(): boolean {
        for (const [a, need] of this.needed) {
            const have = this.delivered.get(a) ?? 0;
            if (have < need) return false;
        }
        return true;
    }

    public getAllProgress() {
        const result = new Map<EquipmentArchetype, { delivered: number; needed: number }>();
        this.needed.forEach((need, a) => {
            result.set(a, { delivered: this.delivered.get(a) ?? 0, needed: need });
        });
        return result;
    }
}
