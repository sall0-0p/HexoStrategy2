import {Hex} from "../hex/Hex";
import {Signal} from "../../../shared/classes/Signal";
import {Nation} from "../nation/Nation";
import {HexRepository} from "../hex/HexRepository";
import {NationRepository} from "../nation/NationRepository";

const hexRepository = HexRepository.getInstance();
const nationRepository = NationRepository.getInstance();
export class Region {
    private id: string;
    private name: string;
    private hexes: Hex[];
    private owner: Nation;
    private population: number;

    private changedSignal?: Signal<[string, unknown]>;

    constructor(id: string, data: JsonRegion) {
        this.id = id;
        this.name = data.name;
        this.population = data.population;
        this.hexes = data.hexes.map((hexId) => {
            const candidate = hexRepository.getById(hexId);
            if (!candidate) error(`Failed to load states, hex ${hexId} was not found!`);
            return candidate;
        });

        const ownerCandidate = nationRepository.getById(data.owner);
        if(!ownerCandidate) error(`Failed to load states, nation with id ${data.owner} was not found.`)
        this.owner = ownerCandidate;
    }
}

export interface JsonRegion {
    name: string,
    hexes: string[],
    owner: string,
    population: number,
}