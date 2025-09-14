import {ClientEquipmentStockpile} from "./ClientEquipmentStockpile";
import {ClientEquipmentReservation} from "./ClientEquipmentReservation";
import {
    MessageType,
    StockpileDeltaDTO,
    StockpileSnapshotDTO
} from "../../../shared/network/stockpile/StockpileNetworking";
import {
    ReservationCancelDTO, ReservationCreateDTO,
    ReservationDoneDTO, ReservationMessageType,
    ReservationProgressDTO, ReservationSnapshotDTO
} from "../../../shared/network/stockpile/ReservationNetworking";
import {EquipmentArchetype} from "../../../shared/constants/EquipmentArchetype";
import {Nation} from "../../world/nation/Nation";
import {ReplicatedStorage} from "@rbxts/services";
import {Signal} from "../../../shared/classes/Signal";

const sReplicator = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("StockpileReplicator") as RemoteEvent;
const rReplicator = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("ReservationReplicator") as RemoteEvent;

export class NationEquipmentComponent {
    private readonly stockpile: ClientEquipmentStockpile;

    private reservations: Map<string, ClientEquipmentReservation> = new Map();
    public readonly changed: Signal<[]> = new Signal();

    // TODO: nation instance if needed for cross-links
    constructor(private readonly nation: Nation) {
        this.stockpile = new ClientEquipmentStockpile("Nation", nation.getId());
        sReplicator.OnClientEvent.Connect((d) => this.process(d));
        rReplicator.OnClientEvent.Connect((d) => this.process(d));
    }

    public getStockpile() {
        return this.stockpile;
    }

    public process(dto:
                       | StockpileSnapshotDTO
                       | StockpileDeltaDTO
                       | ReservationCreateDTO
                       | ReservationProgressDTO
                       | ReservationDoneDTO
                       | ReservationCancelDTO
                       | ReservationSnapshotDTO
    ) {
        const result = pcall(() => { this.apply(dto) });

        // Errored
        if (!result[0]) {
            warn(result[1]);
            task.delay(1, () => this.process(dto));
        }
    }

    /** Accept either stockpile or reservation DTOs that concern this nation */
    public apply(
        dto:
            | StockpileSnapshotDTO
            | StockpileDeltaDTO
            | ReservationCreateDTO
            | ReservationProgressDTO
            | ReservationDoneDTO
            | ReservationCancelDTO
            | ReservationSnapshotDTO
    ) {
        // Stockpile messages
        if ("type" in dto && (dto.type === MessageType.StockpileSnapshot || dto.type === MessageType.StockpileDelta)) {
            this.stockpile.apply(dto);
            this.changed.fire();
            return;
        }

        // Reservation messages
        switch ((dto as { type: number }).type) {
            case ReservationMessageType.ReservationSnapshot: {
                const snap = dto as ReservationSnapshotDTO;
                if (snap.nationId !== this.nation.getId()) return;
                this.reservations = new Map();
                snap.reservations.forEach((r) => {
                    const createLike: ReservationCreateDTO = {
                        type: ReservationMessageType.ReservationCreate,
                        nationId: snap.nationId,
                        unitId: r.unitId,
                        reservationId: r.reservationId,
                        requirements: r.requirements,
                    };
                    const c = new ClientEquipmentReservation(createLike);
                    if (r.complete) c.applyDone({ type: ReservationMessageType.ReservationDone, reservationId: r.reservationId });
                    this.reservations.set(r.reservationId, c);
                });
                this.changed.fire();
                return;
            }
            case ReservationMessageType.ReservationCreate: {
                const create = dto as ReservationCreateDTO;
                if (create.nationId !== this.nation.getId()) return;
                const c = new ClientEquipmentReservation(create);
                this.reservations.set(create.reservationId, c);
                this.changed.fire();
                return;
            }
            case ReservationMessageType.ReservationProgress: {
                const prog = dto as ReservationProgressDTO;
                const r = this.reservations.get(prog.reservationId);
                if (r) r.applyProgress(prog);
                this.changed.fire();
                return;
            }
            case ReservationMessageType.ReservationDone: {
                const done = dto as ReservationDoneDTO;
                const r = this.reservations.get(done.reservationId);
                if (r) r.applyDone(done);
                this.changed.fire();
                return;
            }
            case ReservationMessageType.ReservationCancel: {
                const cancel = dto as ReservationCancelDTO;
                this.reservations.delete(cancel.reservationId);
                this.changed.fire();
                return;
            }
        }
    }

    /** Mirrors server getReservationsProgress for UI convenience */
    public getReservationsProgress(): Map<ClientEquipmentReservation, Map<EquipmentArchetype, { delivered: number; needed: number }>> {
        const out = new Map<
            ClientEquipmentReservation,
            Map<EquipmentArchetype, { delivered: number; needed: number }>
        >();
        this.reservations.forEach((r) => out.set(r, r.getAllProgress()));
        return out;
    }

    /** Expose only reservations belonging to a specific unit (to be used by UEC mirror) */
    public getReservationsForUnit(unitId: string): ClientEquipmentReservation[] {
        const res: ClientEquipmentReservation[] = [];
        this.reservations.forEach((r) => {
            if (r["unitId"] === unitId) res.push(r);
        });
        return res;
    }

    public getTotalNeededForArchetype(a: EquipmentArchetype) {
        let total = 0;
        this.reservations.forEach((r) => {
            r.getAllProgress().forEach((n, pa) => {
                if (pa === a) {
                      total += n.needed;
                }
            })
        })

        return total;
    }
}
