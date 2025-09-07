import {EquipmentArchetype} from "../../../shared/constants/EquipmentArchetype";
import {EquipmentReservation} from "./reservation/EquipmentReservation";
import {Nation} from "../../world/nation/Nation";
import {TimeSignalType, WorldTime} from "../time/WorldTime";
import {EquipmentStockpile} from "./stockpile/EquipmentStockpile";
import {EquipmentReservationReplicator} from "./reservation/EquipmentReservationReplicator";
import {BaseEquipmentType} from "./type/BaseEquipmentType";

export class NationEquipmentComponent {
    private readonly stockpile: EquipmentStockpile;
    private readonly reservations: Set<EquipmentReservation> = new Set();
    private readonly replicator: EquipmentReservationReplicator;

    constructor(private readonly nation: Nation) {
        WorldTime.getInstance().on(TimeSignalType.Hour).connect(() => this.updateReservations());
        this.stockpile = new EquipmentStockpile("Nation", nation);
        this.replicator = new EquipmentReservationReplicator(nation, () => this.reservations);
    }

    public getStockpile() {
        return this.stockpile;
    }

    public createReservation(
        reservation: EquipmentReservation
    ): EquipmentReservation {
        const unitId = reservation.unit?.getId();
        this.reservations.add(reservation);

        this.replicator.sendCreate(reservation, unitId);
        return reservation;
    }

    public cancelReservation(res: EquipmentReservation) {
        if (this.reservations.delete(res)) {
            this.replicator.sendCancel(res);
        }
    }

    public updateReservations() {
        for (const res of this.reservations) {
            let lastPayload: Map<BaseEquipmentType, number> | undefined;

            const originalOnDeliver = (res as unknown as { onDeliver?: (p: Map<BaseEquipmentType, number>) => void }).onDeliver;
            (res as unknown as { onDeliver?: (p: Map<BaseEquipmentType, number>) => void }).onDeliver = (p) => {
                lastPayload = p;
                if (originalOnDeliver) originalOnDeliver(p);
            };

            res.deliverFrom(this.stockpile);

            if (res.consumeDirty()) {
                if (lastPayload && lastPayload.size() > 0) {
                    this.replicator.sendProgress(res, lastPayload);
                } else {
                    // nothing concrete delivered, but counts might have changed earlier: mark dirty for hourly flush
                    this.replicator.markDirty(res);
                }
            }

            if (res.isComplete()) {
                this.reservations.delete(res);
                this.replicator.sendDone(res);
            }
        }
    }

    public getReservationsProgress(): Map<EquipmentReservation, Map<EquipmentArchetype, { delivered: number; needed: number }>> {
        const result = new Map<
            EquipmentReservation,
            Map<EquipmentArchetype, { delivered: number; needed: number }>
        >();

        for (const res of this.reservations) {
            result.set(res, res.getAllProgress());
        }
        return result;
    }
}
