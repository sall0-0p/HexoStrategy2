import {EquipmentArchetype} from "../../../../shared/constants/EquipmentArchetype";
import {BaseEquipmentType} from "../type/BaseEquipmentType";
import {EquipmentStockpile} from "../stockpile/EquipmentStockpile";
import {Nation} from "../../../world/nation/Nation";
import {Unit} from "../../unit/Unit";
import {ReservationRequirementDTO} from "../../../../shared/network/stockpile/ReservationNetworking";

export class EquipmentReservation {
    public readonly id: string = ReservationCounter.getNext();
    public readonly nation: Nation;
    public readonly unit?: Unit;

    private needed: Map<EquipmentArchetype, number>;
    private delivered: Map<EquipmentArchetype, number> = new Map();
    private onDeliver?: (payload: Map<BaseEquipmentType, number>) => void;
    private onComplete?: () => void;

    private dirty: boolean = false;

    constructor(
        nation: Nation,
        requirements: Map<EquipmentArchetype, number>,
        onDeliver?: (payload: Map<BaseEquipmentType, number>) => void,
        onComplete?: () => void,
        unit?: Unit,
    ) {
        this.nation = nation;
        this.unit = unit;
        this.needed = requirements;
        this.onDeliver = onDeliver;
        this.onComplete = onComplete;
        requirements.forEach((_, a) => this.delivered.set(a, 0));
    }

    /** Try to fulfill part of this reservation from national stockpile */
    public deliverFrom(stockpile: EquipmentStockpile) {
        const payload = new Map<BaseEquipmentType, number>();
        let anyDelivered = false;

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
                    anyDelivered = true;
                    this.delivered.set(archetype, deliveredSoFar + deliveredCount);
                }
            }
        });

        if (anyDelivered) this.dirty = true;

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

    public consumeDirty(): boolean {
        if (!this.dirty) return false;
        this.dirty = false;
        return true;
    }

    public getAllProgress() {
        const result = new Map<EquipmentArchetype, { delivered: number; needed: number }>();
        this.needed.forEach((need, a) => {
            result.set(a, { delivered: this.delivered.get(a) ?? 0, needed: need });
        });
        return result;
    }

    public toRequirementsDTO(): ReservationRequirementDTO[] {
        const requirements: ReservationRequirementDTO[] = [];
        this.needed.forEach((need, a) => {
            requirements.push({
                archetype: a,
                needed: need,
                delivered: this.delivered.get(a) ?? 0,
            });
        });

        return requirements;
    }
}

namespace ReservationCounter {
    let currentId = 0;

    export function getNext() {
        return tostring(currentId++);
    }
}