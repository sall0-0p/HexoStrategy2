import {Hex} from "../hex/Hex";
import {Nation} from "../nation/Nation";
import {RegionDTO} from "../../../shared/network/region/DTO";
import {HexRepository} from "../hex/HexRepository";
import {NationRepository} from "../nation/NationRepository";
import {Signal} from "../../../shared/classes/Signal";
import {StateCategory} from "../../../shared/types/StateCategory";
import {StateCategories} from "../../../shared/data/ts/StateCategories";
import {Building} from "../../../shared/data/ts/BuildingDefs";
import {ModifierContainer} from "../../systems/modifier/ModifierContainer";
import {ModifierParent} from "../../../shared/types/Modifier";
import {ClientRegionResourceView} from "../../systems/resource/ClientRegionResourceView";

export class Region {
    private id: string;
    private name: string;
    private category: StateCategory;
    private hexes: Hex[];
    private owner: Nation;
    private population: number;
    private buildings: RegionBuildings;
    private modifiers: ModifierContainer;
    private resources = new ClientRegionResourceView();

    private hexRepository = HexRepository.getInstance();
    private nationRepository = NationRepository.getInstance();

    public changed: Signal<[string, unknown]> = new Signal();

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
            built: data.buildings.built,
            planned: data.buildings.planned,
            slots: data.buildings.slots,
        }
        this.modifiers = new ModifierContainer(this.id, ModifierParent.Region);
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
        this.changed.fire("owner", owner);
    }

    public getPopulation() {
        return this.population;
    }

    public getBuildings() {
        return this.buildings;
    }

    public setBuildings(buildings: RegionBuildings) {
        this.buildings = buildings;
        this.changed.fire("buildings", buildings);
    }

    public getModifiers() {
        return this.modifiers;
    }

    public getResources() {
        return this.resources;
    }
}

export interface RegionBuildings {
    slots: Map<Building, number>,
    planned: Map<Building, number>,
    built: Map<Building, number>,
}