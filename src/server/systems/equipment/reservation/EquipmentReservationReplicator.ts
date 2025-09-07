import {EquipmentReservation} from "./EquipmentReservation";
import {Connection} from "../../../../shared/classes/Signal";
import {Nation} from "../../../world/nation/Nation";
import {Players, ReplicatedStorage} from "@rbxts/services";
import {TimeSignalType, WorldTime} from "../../time/WorldTime";
import {
    DeliveredPayloadEntryDTO, ReservationCancelDTO,
    ReservationCreateDTO, ReservationDoneDTO,
    ReservationMessageType,
    ReservationProgressDTO, ReservationSnapshotDTO
} from "../../../../shared/network/stockpile/ReservationNetworking";
import {BaseEquipmentType} from "../type/BaseEquipmentType";

const replicator = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("ReservationReplicator") as RemoteEvent;

export class EquipmentReservationReplicator {
    private dirty: Set<EquipmentReservation> = new Set();
    private plrConnection: RBXScriptConnection;
    private hourConnection: Connection;

    public constructor(
        private readonly nation: Nation,
        private readonly getAllReservations: () => Set<EquipmentReservation>,
    ) {
        this.plrConnection = Players.PlayerAdded.Connect((p) => this.sendSnapshot(p));
        this.hourConnection = WorldTime.getInstance().on(TimeSignalType.Hour).connect(() => this.flush());
    }

    public markDirty(res: EquipmentReservation) {
        this.dirty.add(res);
    }

    public sendCreate(res: EquipmentReservation, unitId?: string) {
        const message: ReservationCreateDTO = {
            type: ReservationMessageType.ReservationCreate,
            nationId: this.nation.getId(),
            unitId,
            reservationId: res.id,
            requirements: res.toRequirementsDTO(),
        };
        replicator.FireAllClients(message);
    }

    public sendProgress(res: EquipmentReservation, payload?: Map<BaseEquipmentType, number>) {
        let deliveredPayload: DeliveredPayloadEntryDTO[] | undefined;
        if (payload) {
            deliveredPayload = [];
            payload.forEach((count, t) => {
                deliveredPayload!.push({
                    typeId: t.getId(),
                    count,
                });
            });
        }

        const message: ReservationProgressDTO = {
            type: ReservationMessageType.ReservationProgress,
            reservationId: res.id,
            progress: res.toRequirementsDTO(),
            deliveredPayload,
        };
        replicator.FireAllClients(message);
    }

    public sendDone(res: EquipmentReservation) {
        const message: ReservationDoneDTO = {
            type: ReservationMessageType.ReservationDone,
            reservationId: res.id,
        };
        replicator.FireAllClients(message);
    }

    public sendCancel(res: EquipmentReservation) {
        const message: ReservationCancelDTO = {
            type: ReservationMessageType.ReservationCancel,
            reservationId: res.id,
        };
        replicator.FireAllClients(message);
    }

    public sendSnapshot(player?: Player) {
        const reservations = this.getAllReservations();
        if (reservations.size() === 0) return;

        const dto: ReservationSnapshotDTO = {
            type: ReservationMessageType.ReservationSnapshot,
            nationId: this.nation.getId(),
            reservations: [],
        };

        reservations.forEach((r) => {
            dto.reservations.push({
                reservationId: r.id,
                unitId: r.unit?.getId(),
                requirements: r.toRequirementsDTO(),
                complete: r.isComplete(),
            });
        });

        if (player) {
            replicator.FireClient(player, dto);
        } else {
            replicator.FireAllClients(dto);
        }
    }

    public flush() {
        if (this.dirty.size() === 0) return;
        this.dirty.forEach((r) => this.sendProgress(r));
        this.dirty.clear();
    }

    public cleanup() {
        this.plrConnection.Disconnect();
        this.hourConnection.disconnect();
    }
}