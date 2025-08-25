import {RegionRepository} from "../../../world/region/RegionRepository";
import {ResourceFlair} from "./ResourceFlair";

export class ResourceFlairManager {
    private flairs: ResourceFlair[] = [];

    private regionRepository = RegionRepository.getInstance();
    private static instance: ResourceFlairManager;
    private constructor() {

    }

    public show() {
        this.clear();

        const regions = this.regionRepository
            .getAll()
            .filter((r) =>
                r.getOwner().getId() === _G.activeNationId);

        regions.forEach((r) => {
            this.flairs.push(new ResourceFlair(r));
        })
    }

    public clear() {
        this.flairs.forEach((f) => f.destroy());
    };

    public static getInstance() {
        if (!this.instance) {
            this.instance = new ResourceFlairManager();
        }

        return this.instance;
    }
}