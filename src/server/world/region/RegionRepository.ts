import {JsonRegion, Region} from "./Region";
import raw from "shared/data/regions.json";

export class RegionRepository {
    private regionsById = new Map<string, Region>;

    private static instance: RegionRepository;
    private constructor() {
        for (const [id, rawDef] of pairs(raw as Record<string, JsonRegion>)) {
            const newRegion = new Region(id, rawDef);
            this.regionsById.set(id, newRegion);
        }
    }

    public static getInstance(): RegionRepository {
        if (!this.instance) {
            this.instance = new RegionRepository();
        }

        return this.instance;
    }

    public getById(id: string) {
        return this.regionsById.get(id);
    }

    public getAll(): Region[] {
        let result: Region[] = [];
        this.regionsById.forEach((region) => {
            result.push(region);
        })
        return result;
    }
}