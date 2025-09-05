import {EquipmentArchetype} from "../../../shared/constants/EquipmentArchetype";
import {EquipmentReservation} from "./EquipmentReservation";
import {Nation} from "../../world/nation/Nation";
import {TimeSignalType, WorldTime} from "../time/WorldTime";
import {EquipmentStockpile} from "./stockpile/EquipmentStockpile";

export class NationEquipmentComponent {
    private readonly stockpile: EquipmentStockpile;
    private readonly reservations: Set<EquipmentReservation> = new Set();

    constructor(private readonly nation: Nation) {
        WorldTime.getInstance().on(TimeSignalType.Hour).connect(() => this.updateReservations());
        print(nation);
        this.stockpile = new EquipmentStockpile("Nation", nation);
    }

    public getStockpile() {
        return this.stockpile;
    }

    public createReservation(
        reservation: EquipmentReservation
    ): EquipmentReservation {
        this.reservations.add(reservation);
        return reservation;
    }

    public cancelReservation(res: EquipmentReservation) {
        this.reservations.delete(res);
    }

    public updateReservations() {
        // We just attempt to deliver to each reservation
        for (const res of this.reservations) {
            res.deliverFrom(this.stockpile);

            if (res.isComplete()) {
                this.reservations.delete(res);
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
