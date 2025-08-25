import {
    ResourceMap,
    ResourceReservationType,
    ResourceSourceType,
    ResourceType
} from "../../../shared/constants/ResourceDef";
import {Nation} from "../../world/nation/Nation";
import {Signal} from "../../../shared/classes/Signal";
import {NationResourceDTO} from "../../../shared/network/nation/DTO";

export class NationResourceComponent {
    private total: ResourceMap = new Map();
    private reserved: ResourceMap = new Map();
    private available: ResourceMap = new Map();

    private sources: Map<ResourceSourceType, ResourceMap> = new Map();
    private reservations: Map<ResourceReservationType, ResourceMap> = new Map();

    public readonly updated: Signal<[]> = new Signal();

    constructor(
        private readonly nation: Nation,
        private readonly replicate: () => void,
    ) {
        task.delay(1, () => this.recompute());
    }

    public getSource(source: ResourceSourceType) {
        const existing = this.sources.get(source);
        if (existing) return existing;
        const newMap = new Map<ResourceType, number>();
        this.sources.set(source, newMap);
        return newMap;
    }

    public getSources() {
        return this.sources;
    }

    public setSource(source: ResourceSourceType, payload: ResourceMap) {
        this.sources.set(source, payload);
        this.recompute();
    }

    public setSourceForResource(source: ResourceSourceType, resource: ResourceType, count: number) {
        const map = this.getSource(source);
        map.set(resource, count);
        this.recompute();
    }

    public getReservation(reservation: ResourceReservationType) {
        const existing = this.reservations.get(reservation);
        if (existing) return existing;
        const newMap = new Map<ResourceType, number>();
        this.reservations.set(reservation, newMap);
        return newMap;
    }

    public getReservations() {
        return this.reservations;
    }

    public setReservation(reservation: ResourceReservationType, payload: ResourceMap) {
        this.reservations.set(reservation, payload);
        this.recompute();
    }

    public setReservationFor(reservation: ResourceReservationType, resource: ResourceType, count: number) {
        const map = this.getReservation(reservation);
        map.set(resource, count);
        this.recompute();
    }

    private applyDelta(target: ResourceMap, deltas: ResourceMap) {
        for (const [res, delta] of deltas) {
            const current = target.get(res) ?? 0;
            const nextt = current + delta;
            if (nextt <= 0) target.delete(res);
            else target.set(res, nextt);
        }
    }

    public addRegionDelta(deltas: ResourceMap) {
        this.addSourceDelta(ResourceSourceType.Region, deltas);
        this.recompute();
    }

    public addSourceDelta(source: ResourceSourceType, deltas: ResourceMap) {
        const map = this.getSource(source);
        this.applyDelta(map, deltas);
        this.recompute();
    }

    public addReservationDelta(reservation: ResourceReservationType, deltas: ResourceMap) {
        const map = this.getReservation(reservation);
        this.applyDelta(map, deltas);
        this.recompute();
    }

    public getAvailable(): ResourceMap {
        return this.available;
    }

    public getReserved(): ResourceMap {
        return this.reserved;
    }

    public getTotal(): ResourceMap {
        return this.total;
    }

    public toDTO(includeBreakdown = false): NationResourceDTO {
        const dto: NationResourceDTO = {
            total: this.total,
            reserved: this.reserved,
            available: this.available,
        }

        if (includeBreakdown) {
            dto.sources = this.sources;
            dto.reserved = this.reserved;
        }

        return dto;
    }

    public recompute() {
        this.total = new Map();
        for (const [, map] of this.sources) {
            for (const [res, count] of map) {
                this.total.set(res, (this.total.get(res) ?? 0) + count);
            }
        }

        this.reserved = new Map();
        for (const [, map] of this.reservations) {
            for (const [res, count] of map) {
                this.reserved.set(res, (this.reserved.get(res) ?? 0) + count);
            }
        }

        this.available = new Map();
        for (const [res, totalCount] of this.total) {
            const reservedCount = this.reserved.get(res) ?? 0;
            this.available.set(res, math.max(0, totalCount - reservedCount));
        }

        this.updated.fire();
        this.replicate();
    }
}
