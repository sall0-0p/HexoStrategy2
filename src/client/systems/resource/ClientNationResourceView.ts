import {
    ResourceMap,
    ResourceReservationType,
    ResourceSourceType,
    ResourceType
} from "../../../shared/constants/ResourceDef";
import {Signal} from "../../../shared/classes/Signal";
import {NationResourceDTO} from "../../../shared/network/nation/DTO";

export class ClientNationResourceView {
    private total: ResourceMap = new Map();
    private reserved: ResourceMap = new Map();
    private available: ResourceMap = new Map();
    private sources?: Map<ResourceSourceType, ResourceMap>;
    private reservations?: Map<ResourceReservationType, ResourceMap>;

    public readonly updated: Signal<[]> = new Signal();

    public apply(dto: NationResourceDTO) {
        this.total = dto.total;
        this.reserved = dto.reserved;
        this.available = dto.available;
        this.sources = dto.sources;
        this.reservations = dto.reservations;
        this.updated.fire();
    }

    public getTotal(resource: ResourceType) { return this.total.get(resource) ?? 0; }
    public getReserved(resource: ResourceType) { return this.reserved.get(resource) ?? 0; }
    public getAvailable(resource: ResourceType) { return this.available.get(resource) ?? 0; }

    public getTotals(): ResourceMap { return this.total; }
    public getReserveds(): ResourceMap { return this.reserved; }
    public getAvailables(): ResourceMap { return this.available; }

    public getSources(): Map<ResourceSourceType, ResourceMap> | undefined { return this.sources; }
    public getReservations(): Map<ResourceReservationType, ResourceMap> | undefined { return this.reservations; }
}
