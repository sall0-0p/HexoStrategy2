import { EquipmentArchetype } from "../../../shared/constants/EquipmentArchetype";
import {
    DeliveredPayloadEntryDTO,
    ReservationCreateDTO,
    ReservationDoneDTO,
    ReservationMessageType,
    ReservationProgressDTO,
    ReservationRequirementDTO,
} from "../../../shared/network/stockpile/ReservationNetworking";
import {BaseEquipmentType} from "./type/BaseEquipmentType";
import {EquipmentTypeRepository} from "./type/EquipmentTypeRepository";

/** Client mirror of a single reservation; stores progress + last delivered payload for UI */
export class ClientEquipmentReservation {
    public readonly reservationId: string;
    public readonly nationId: string;
    public readonly unitId?: string;

    private progress: Map<EquipmentArchetype, { delivered: number; needed: number }> = new Map();
    private complete = false;
    private lastDeliveredPayload?: Map<BaseEquipmentType, number>;

    constructor(create: ReservationCreateDTO) {
        this.reservationId = create.reservationId;
        this.nationId = create.nationId;
        this.unitId = create.unitId;
        this.resetFrom(create.requirements);
    }

    // TODO: resolve equipment type by typeId
    private resolveType(typeId: string): BaseEquipmentType {
        const repo = EquipmentTypeRepository.getInstance();
        const candidate = repo.getById(typeId);
        if (!candidate) error(`Failed to source equipmentType ${typeId}`);
        return candidate;
    }

    private resetFrom(reqs: ReservationRequirementDTO[]) {
        this.progress = new Map();
        reqs.forEach((r) => this.progress.set(r.archetype, { delivered: r.delivered, needed: r.needed }));
        this.complete = this.computeComplete();
    }

    private computeComplete(): boolean {
        for (const [a, st] of this.progress) {
            if (st.delivered < st.needed) return false;
        }
        return true;
    }

    public applyProgress(dto: ReservationProgressDTO) {
        for (const r of dto.progress) {
            const cur = this.progress.get(r.archetype);
            if (cur) {
                cur.delivered = r.delivered;
                cur.needed = r.needed;
            } else {
                this.progress.set(r.archetype, { delivered: r.delivered, needed: r.needed });
            }
        }
        this.complete = this.computeComplete();
        this.lastDeliveredPayload = this.payloadToMap(dto.deliveredPayload);
    }

    public applyDone(_dto: ReservationDoneDTO) {
        this.complete = true;
    }

    public isComplete(): boolean {
        return this.complete;
    }

    public getAllProgress(): Map<EquipmentArchetype, { delivered: number; needed: number }> {
        return this.progress;
    }

    public getLastDeliveredPayload(): Map<BaseEquipmentType, number> | undefined {
        return this.lastDeliveredPayload;
    }

    private payloadToMap(payload?: DeliveredPayloadEntryDTO[]): Map<BaseEquipmentType, number> | undefined {
        if (!payload || payload.size() === 0) return undefined;
        const out = new Map<BaseEquipmentType, number>();
        payload.forEach((p) => {
            const t = this.resolveType(p.typeId);
            out.set(t, (out.get(t) ?? 0) + p.count);
        });
        return out;
    }
}
