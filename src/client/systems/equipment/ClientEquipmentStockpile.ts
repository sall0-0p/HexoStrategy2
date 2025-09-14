import { EquipmentArchetype } from "../../../shared/constants/EquipmentArchetype";
import {
    MessageType,
    StockpileDeltaDTO,
    StockpileEntryDTO,
    StockpileSnapshotDTO,
} from "../../../shared/network/stockpile/StockpileNetworking"; // adjust import path if different
import { MessageTarget } from "../../../shared/network/stockpile/StockpileNetworking";
import {BaseEquipmentType} from "./type/BaseEquipmentType";
import {EquipmentTypeRepository} from "./type/EquipmentTypeRepository";

type EquipmentMap = Map<EquipmentArchetype, Map<BaseEquipmentType, number>>;

/** Lightweight client mirror of a stockpile; no game logic, just state sync */
export class ClientEquipmentStockpile {
    private readonly target: MessageTarget;
    private readonly targetId: string;

    private stockpile: EquipmentMap = new Map();
    public changed = false; // for UI refresh hints

    constructor(target: MessageTarget, targetId: string) {
        this.target = target;
        this.targetId = targetId;
    }

    // TODO: resolve equipment type by string id from your registry
    private resolveType(typeId: string): BaseEquipmentType {
        const repo = EquipmentTypeRepository.getInstance();
        const candidate = repo.getById(typeId);
        if (!candidate) error(`Failed to source equipmentType ${typeId}`);
        return candidate;
    }

    private ensureArchetype(a: EquipmentArchetype): Map<BaseEquipmentType, number> {
        const m = this.stockpile.get(a);
        if (m) return m;
        const nm = new Map<BaseEquipmentType, number>();
        this.stockpile.set(a, nm);
        return nm;
    }

    private applyEntries(entries: StockpileEntryDTO[]) {
        for (const e of entries) {
            const t = this.resolveType(e.typeId);
            const m = this.ensureArchetype(e.archetype);
            m.set(t, e.count);
        }
        this.changed = true;
    }

    /** Apply either snapshot or delta for this stockpile */
    public apply(dto: StockpileSnapshotDTO | StockpileDeltaDTO) {
        if (dto.target !== this.target || dto.targetId !== this.targetId) return;

        if (dto.type === MessageType.StockpileSnapshot) {
            this.stockpile = new Map();
            this.applyEntries(dto.entries);
        } else {
            this.applyEntries(dto.entries);
        }
    }

    public getAll(): Map<BaseEquipmentType, number> {
        const out = new Map<BaseEquipmentType, number>();
        this.stockpile.forEach((m) => m.forEach((n, t) => out.set(t, n)));
        return out;
    }

    public getForArchetype(a: EquipmentArchetype): ReadonlyMap<BaseEquipmentType, number> {
        return this.ensureArchetype(a);
    }

    public getCountForType(t: BaseEquipmentType): number {
        const m = this.ensureArchetype(t.getArchetype());
        return m.get(t) ?? 0;
    }

    public getCountForArchetype(a: EquipmentArchetype): number {
        const m = this.ensureArchetype(a);
        let sum = 0;
        m.forEach((n) => (sum += n));
        return sum;
    }

    public getStockpile() {
        return this.stockpile as ReadonlyMap<EquipmentArchetype, ReadonlyMap<BaseEquipmentType, number>>;
    }
}
