import {ClientEquipmentStockpile} from "./ClientEquipmentStockpile";
import {ClientEquipmentReservation} from "./ClientEquipmentReservation";
import {
    MessageType,
    StockpileDeltaDTO,
    StockpileSnapshotDTO
} from "../../../shared/network/stockpile/StockpileNetworking";
import {
    ReservationCancelDTO,
    ReservationCreateDTO,
    ReservationDoneDTO, ReservationMessageType,
    ReservationProgressDTO, ReservationSnapshotDTO
} from "../../../shared/network/stockpile/ReservationNetworking";
import {EquipmentArchetype} from "../../../shared/constants/EquipmentArchetype";
import {Unit} from "../unit/Unit";
import {ReplicatedStorage} from "@rbxts/services";

const sReplicator = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("StockpileReplicator") as RemoteEvent;
const rReplicator = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("ReservationReplicator") as RemoteEvent;

export class UnitEquipmentComponent {
    private readonly stockpile: ClientEquipmentStockpile;

    /** Only reservations that target this unit */
    private reservations: Map<string, ClientEquipmentReservation> = new Map();

    constructor(private readonly unit: Unit) {
        this.stockpile = new ClientEquipmentStockpile("Unit", unit.getId());

        // TODO: Unbind, potential memory leak.
        sReplicator.OnClientEvent.Connect((d) => this.apply(d));
        rReplicator.OnClientEvent.Connect((d) => this.apply(d));
    }

    public getStockpile() {
        return this.stockpile;
    }

    /** Accept stockpile messages for this unit and reservation messages that reference this unit */
    public apply(
        dto:
            | StockpileSnapshotDTO
            | StockpileDeltaDTO
            | ReservationCreateDTO
            | ReservationProgressDTO
            | ReservationDoneDTO
            | ReservationSnapshotDTO
    ) {
        // Stockpile messages
        if ("type" in dto && (dto.type === MessageType.StockpileSnapshot || dto.type === MessageType.StockpileDelta)) {
            this.stockpile.apply(dto);
            return;
        }

        // Reservation messages (subset for this unit)
        switch ((dto as { type: number }).type) {
            case ReservationMessageType.ReservationCreate: {
                const create = dto as ReservationCreateDTO;
                if (create.nationId !== this.unit.getOwner().getId()) return;
                if (create.unitId !== this.unit.getId()) return;
                const r = new ClientEquipmentReservation(create);
                this.reservations.set(create.reservationId, r);
                return;
            }
            case ReservationMessageType.ReservationProgress: {
                const prog = dto as ReservationProgressDTO;
                const r = this.reservations.get(prog.reservationId);
                if (r) r.applyProgress(prog);
                return;
            }
            case ReservationMessageType.ReservationDone: {
                const done = dto as ReservationDoneDTO;
                const r = this.reservations.get(done.reservationId);
                if (r) r.applyDone(done);
                return;
            }
            case ReservationMessageType.ReservationCancel: {
                const cancel = dto as unknown as ReservationCancelDTO;
                this.reservations.delete(cancel.reservationId);
                return;
            }
        }
    }

    public getReservationsProgress(): Map<ClientEquipmentReservation, Map<EquipmentArchetype, { delivered: number; needed: number }>> {
        const out = new Map<
            ClientEquipmentReservation,
            Map<EquipmentArchetype, { delivered: number; needed: number }>
        >();
        this.reservations.forEach((r) => out.set(r, r.getAllProgress()));
        return out;
    }
}
