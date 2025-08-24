import {ConstructionFlair} from "./ConstructionFlair";
import {Building, BuildingDefs} from "../../../../shared/data/ts/BuildingDefs";
import {RegionRepository} from "../../../world/region/RegionRepository";
import {BuildingType} from "../../../../shared/types/BuildingDef";
import {HexRepository} from "../../../world/hex/HexRepository";

export class ConstructionFlairManager {
    private flairs: ConstructionFlair[] = [];

    private regionRepository = RegionRepository.getInstance();
    private hexRepository = HexRepository.getInstance();
    private static instance: ConstructionFlairManager;
    private constructor() {

    }

    public show(building: Building) {
        this.clear();

        if (BuildingDefs[building].type === BuildingType.Hex) {
            const hexes = this.hexRepository
                .getAll()
                .filter((h) =>
                    h.getOwner()?.getId() === _G.activeNationId);

            hexes.forEach((h) => {
                this.flairs.push(new ConstructionFlair(h, building));
            })
        } else {
            const regions = this.regionRepository
                .getAll()
                .filter((r) =>
                    r.getOwner().getId() === _G.activeNationId);

            regions.forEach((r) => {
                this.flairs.push(new ConstructionFlair(r, building));
            })
        }
    }

    public clear() {
        this.flairs.forEach((f) => f.destroy());
    };

    public static getInstance() {
        if (!this.instance) {
            this.instance = new ConstructionFlairManager();
        }

        return this.instance;
    }
}