import {Hex} from "../hex/Hex";
import {Nation} from "../nation/Nation";
import {RegionDTO} from "../../../shared/dto/RegionDTO";
import {HexRepository} from "../hex/HexRepository";
import {NationRepository} from "../nation/NationRepository";
import {Signal} from "../../../shared/classes/Signal";

export class Region {
    private id: string;
    private name: string;
    private hexes: Hex[];
    private owner: Nation;
    private population: number;

    private hexRepository = HexRepository.getInstance();
    private nationRepository = NationRepository.getInstance();

    private changedSignal?: Signal<[string, unknown]>;

    constructor(data: RegionDTO) {
        this.id = data.id;
        this.name = data.name;
        this.hexes = data.hexes.map((hexId) => {
            const candidate = this.hexRepository.getById(hexId);
            if (!candidate) error(`Failed to find ${hexId} for ${data.id}`);
            candidate.setRegion(this);
            return candidate;
        })
        this.owner = this.nationRepository.getById(data.owner) ?? error(`Failed to find ${data.owner} for ${data.id}`);
        this.population = data.population;
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
}