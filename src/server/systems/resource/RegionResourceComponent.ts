import { ResourceMap, ResourceType } from "../../../shared/constants/ResourceDef";
import { RegionBuildingComponent } from "../../systems/construction/BuildingComponent";
import { Building, BuildingDefs } from "../../../shared/data/ts/BuildingDefs";
import {Region} from "../../world/region/Region";
import {RegionResourceDTO} from "../../../shared/network/region/DTO";

export class RegionResourceComponent {
    private base: ResourceMap = new Map();
    private current: ResourceMap = new Map();
    private lastPublished: ResourceMap = new Map();

    constructor(
        private readonly region: Region,
        private readonly replicate: () => void,
    ) {
        task.delay(1, () => this.recompute());
    }

    public setBase(resources: ResourceMap) {
        this.base.clear();
        resources.forEach((v, k) => this.base.set(k, v));
    }

    public recompute() {
        this.current.clear();
        for (const [_, t] of pairs(ResourceType)) {
            this.current.set(t, this.base.get(t) ?? 0);
        }

        const map = this.region.getBuildings().getBuildings();
        map.forEach((bc, b) => {
            const def = BuildingDefs[b as Building];
            if (!def?.resources) return;
            for (const [t, n] of pairs(def.resources)) {
                const cur = this.current.get(t) ?? 0;
                this.current.set(t, cur + (bc * n));
            }
        });

        const delta = this.diff(this.current, this.lastPublished);
        if (delta.size() > 0) {
            this.region.getOwner().getResources().addRegionDelta(delta);
            this.lastPublished = this.clone(this.current);
        }

        this.replicate();
    }

    public emitRemovalDelta() {
        if (this.lastPublished.size() > 0) {
            this.region.getOwner().getResources().addRegionDelta(this.negate(this.lastPublished));
            this.lastPublished = new Map();
        }
    }

    public getCurrent(): ResourceMap {
        return this.current;
    }

    public toDTO(): RegionResourceDTO {
        return this.getCurrent();
    }

    // helpers
    private clone(src: ResourceMap): ResourceMap {
        const m: ResourceMap = new Map();
        src.forEach((v, k) => m.set(k, v));
        return m;
    }

    private diff(nextt: ResourceMap, prev: ResourceMap): ResourceMap {
        const out = new Map<ResourceType, number>();
        nextt.forEach((v, k) => out.set(k, (out.get(k) ?? 0) + v));
        prev.forEach((v, k) => out.set(k, (out.get(k) ?? 0) - v));
        for (const [k, v] of out) if (v === 0) out.delete(k);
        return out;
    }

    private negate(src: ResourceMap): ResourceMap {
        const out = new Map<ResourceType, number>();
        src.forEach((v, k) => out.set(k, -v));
        return out;
    }
}
