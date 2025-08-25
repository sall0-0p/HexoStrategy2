import {ResourceMap, ResourceType} from "../../../shared/constants/ResourceDef";
import {Signal} from "../../../shared/classes/Signal";
import {RegionResourceDTO} from "../../../shared/network/region/DTO";

export class ClientRegionResourceView {
    private map: ResourceMap = new Map();
    public readonly updated: Signal<[]> = new Signal();

    public apply(dto: RegionResourceDTO) {
        this.map = dto;
        this.updated.fire();
    }

    public get(resource: ResourceType) { return this.map.get(resource) ?? 0; }
    public getAll(): ResourceMap { return this.map; }
}
