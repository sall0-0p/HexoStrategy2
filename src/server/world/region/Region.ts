import {Hex} from "../hex/Hex";
import {Signal} from "../../../shared/classes/Signal";
import {Nation} from "../nation/Nation";
import {HexRepository} from "../hex/HexRepository";
import {RegionDTO} from "../../../shared/network/region/DTO";
import {RegionReplicator} from "./RegionReplicator";
import {NationRepository} from "../nation/NationRepository";
import {ModifierContainer} from "../../systems/modifier/ModifierContainer";
import {StateCategory} from "../../../shared/classes/StateCategory";
import {StateCategories} from "../../../shared/data/ts/StateCategories";
import {RegionBuildingComponent} from "../building/BuildingComponent";
import {Building} from "../../../shared/data/ts/BuildingDefs";

const hexRepository = HexRepository.getInstance();
const nationRepository = NationRepository.getInstance();
export class Region {
    private id: string;
    private name: string;
    private hexes: Hex[];
    private owner: Nation;
    private category: StateCategory;
    private population: number; // in thousands
    private modifiers = new ModifierContainer();
    private buildings = new RegionBuildingComponent(this);

    private changedSignal?: Signal<[string, unknown]>;

    constructor(id: string, data: JsonRegion) {
        this.id = id;
        this.name = data.name;
        this.category = StateCategories[data.category];
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

        if (data.buildings) {
            for (const [id, count] of pairs(data.buildings)) {
                this.buildings.setBuilding(id as Building, count);
            }
        }

        this.buildings.updated.connect(() =>
            this.onBuildingUpdate());
    }

    private onBuildingUpdate() {
        const regionReplicator = RegionReplicator.getInstance();
        regionReplicator?.markAsDirty(this, {
            building: this.buildings.toDTO(),
        })
    }

    public toDTO(): RegionDTO {
        return {
            id: this.getId(),
            name: this.getName(),
            category: this.getCategory().id,
            hexes: this.getHexes().map((hex) => hex.getId()),
            owner: this.getOwner().getId(),
            population: this.getPopulation(),
            building: this.buildings.toDTO(),
        } as RegionDTO
    }

    public getId() {
        return this.id;
    }

    public getName() {
        return this.name;
    }

    public getCategory() {
        return this.category;
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

    public setCategory(category: StateCategory) {
        const regionReplicator = RegionReplicator.getInstance();
        regionReplicator?.markAsDirty(this, {
            category: category.id,
        })
        this.category = category;
    }

    public getPopulation() {
        return this.population;
    }

    public getModifiers() {
        return this.modifiers;
    }

    public getBuildings() {
        return this.buildings;
    }
}

export interface JsonRegion {
    name: string,
    category: string,
    hexes: string[],
    owner: string,
    population: number,
    buildings?: Record<string, number>;
}