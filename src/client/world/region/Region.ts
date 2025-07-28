import {Hex} from "../hex/Hex";
import {Nation} from "../nation/Nation";
import {RegionDTO} from "../../../shared/network/region/DTO";
import {HexRepository} from "../hex/HexRepository";
import {NationRepository} from "../nation/NationRepository";
import {Signal} from "../../../shared/classes/Signal";
import {StateCategory} from "../../../shared/classes/StateCategory";
import {StateCategories} from "../../../shared/data/ts/StateCategories";
import {Building} from "../../../shared/data/ts/BuildingDefs";

export class Region {
    private id: string;
    private name: string;
    private category: StateCategory;
    private hexes: Hex[];
    private owner: Nation;
    private population: number;
    private buildings: Buildings;

    private hexRepository = HexRepository.getInstance();
    private nationRepository = NationRepository.getInstance();

    private changedSignal?: Signal<[string, unknown]>;

    constructor(data: RegionDTO) {
        this.id = data.id;
        this.name = data.name;
        this.category = StateCategories[data.category];
        this.hexes = data.hexes.map((hexId) => {
            const candidate = this.hexRepository.getById(hexId);
            if (!candidate) error(`Failed to find ${hexId} for ${data.id}`);
            candidate.setRegion(this);
            return candidate;
        })
        this.owner = this.nationRepository.getById(data.owner) ?? error(`Failed to find ${data.owner} for ${data.id}`);
        this.population = data.population;
        this.buildings = {
            buildings: data.building.buildings,
            slots: data.building.slots,
        }
    }

    public getId() {
        return this.id;
    }

    public getName() {
        return this.name;
    }

    public getHexes() {
        return this.hexes;
    }

    public getOwner() {
        return this.owner;
    }

    public setOwner(owner: Nation) {
        this.owner = owner;
        this.changedSignal?.fire("owner", owner);
    }

    public getPopulation() {
        return this.population;
    }

    public getBuildings() {
        return this.buildings;
    }
}

interface Buildings {
    slots: Map<Building, number>,
    buildings: Map<Building, number>,
}