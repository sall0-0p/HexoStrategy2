import {EquipmentArchetype} from "../../constants/EquipmentArchetype";

export enum ReservationMessageType {
    ReservationSnapshot,
    ReservationCreate,
    ReservationProgress,
    ReservationDone,
    ReservationCancel,
}

export interface ReservationRequirementDTO {
    archetype: EquipmentArchetype,
    needed: number,
    delivered: number,
}

export interface DeliveredPayloadEntryDTO {
    typeId: string,
    count: number,
}

export interface ReservationCreateDTO {
    type: ReservationMessageType.ReservationCreate,
    nationId: string,
    unitId?: string,
    reservationId: string,
    requirements: ReservationRequirementDTO[],
}

export interface ReservationProgressDTO {
    type: ReservationMessageType.ReservationProgress;
    reservationId: string;
    progress: ReservationRequirementDTO[];
    deliveredPayload?: DeliveredPayloadEntryDTO[];
}

export interface ReservationDoneDTO {
    type: ReservationMessageType.ReservationDone;
    reservationId: string;
}

export interface ReservationCancelDTO {
    type: ReservationMessageType.ReservationCancel;
    reservationId: string;
}

export interface ReservationSnapshotDTO {
    type: ReservationMessageType.ReservationSnapshot;
    nationId: string;
    reservations: Array<{
        reservationId: string;
        unitId?: string;
        requirements: ReservationRequirementDTO[];
        complete: boolean;
    }>;
}