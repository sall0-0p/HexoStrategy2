import {Hex} from "../hex/Hex";
import {Signal} from "../../../shared/classes/Signal";
import {Nation} from "../nation/Nation";
import {HexRepository} from "../hex/HexRepository";
import {RegionDTO} from "../../../shared/network/region/DTO";
import {RegionReplicator} from "./RegionReplicator";
import {NationRepository} from "../nation/NationRepository";
import {ModifierContainer} from "../../systems/modifier/ModifierContainer";

const hexRepository = HexRepository.getInstance();
const nationRepository = NationRepository.getInstance();
export class Region {
    private id: string;
    private name: string;
    private hexes: Hex[];
    private owner: Nation;
    private population: number; // in thousands
    private modifierContainer = new ModifierContainer();

    private changedSignal?: Signal<[string, unknown]>;

    constructor(id: string, data: JsonRegion) {
        this.id = id;
        this.name = data.name;
        this.population = data.population;
        this.hexes = data.hexes.map((hexId) => {
            const candidate = hexRepository.getById(hexId);
            if (!candidate) error(`Failed to load states, hex ${hexId} was not found!`);
            candidate.setRegion(this);

            if (data.owner && !candidate.getOwner()) {
                const tempOwner = nationRepository.getById(data.owner);
                if (!tempOwner) error(`Failed to load nation ${data.owner}`);
                candidate.setOwner(tempOwner, true);
            }
            return candidate;
        });
        this.owner = this.computeOwner();
    }

    public toDTO(): RegionDTO {
        return {
            id: this.getId(),
            name: this.getName(),
            hexes: this.getHexes().map((hex) => hex.getId()),
            owner: this.getOwner().getId(),
            population: this.getPopulation(),
        } as RegionDTO
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

    private computeOwner(): Nation {
        const victoryPoints: Map<string, { nation: Nation, score: number }> = new Map();

        this.hexes.forEach((hex) => {
            const owner = hex.getOwner();
            if (!owner) {
                warn(`Hex ${hex.getId()} has no owner!`);
                return;
            }

            const nationId = owner!.getId();
            if (!victoryPoints.has(nationId)) {
                victoryPoints.set(nationId, { nation: owner!, score: 1 });
            } else {
                const info = victoryPoints.get(nationId)!;
                info.score += 1;
            }
        })

        let topNation: Nation | undefined = undefined;
        let maxCount = -1;
        victoryPoints.forEach((data) => {
            if (data.score > maxCount) {
                topNation = data.nation;
            }
        })

        if (!topNation) error(`Failed to compute owner for ${this.id}`);
        const topNationId = (topNation as Nation).getId()
        if (!this.owner || this.owner.getId() !== topNationId) {
            const regionReplicator = RegionReplicator.getInstance();
            regionReplicator?.markAsDirty(this, {
                owner: topNationId,
            })
        }
        return topNation;
    }

    public updateOwner() {
        this.owner = this.computeOwner();
    };

    public getPopulation() {
        return this.population;
    }

    public getModifierContainer() {
        return this.modifierContainer;
    }
}

export interface JsonRegion {
    name: string,
    hexes: string[],
    owner: string,
    population: number,
}