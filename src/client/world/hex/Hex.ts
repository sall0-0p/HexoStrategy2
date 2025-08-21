import {CubePosition} from "../../../shared/classes/CubePosition";
import {HexDTO} from "../../../shared/network/hex/DTO";
import {Nation} from "../nation/Nation";
import {NationRepository} from "../nation/NationRepository";
import {Signal} from "../../../shared/classes/Signal";
import {HexDispatcher} from "./HexDispatcher";
import {Region} from "../region/Region";
import {Building} from "../../../shared/data/ts/BuildingDefs";
import {ModifierContainer} from "../../systems/modifier/ModifierContainer";
import {ModifierParent} from "../../../shared/classes/Modifier";

export class Hex {
    private readonly id: string;
    private readonly name: string;
    private readonly position: CubePosition;
    private owner?: Nation;
    private region?: Region;
    private neighbors: Hex[] = [];
    private model: Model;
    private buildings: HexBuildings;
    private modifiers: ModifierContainer;

    private nationRepository = NationRepository.getInstance();
    private hexDispatcher = HexDispatcher.getInstance();

    // events
    public readonly changed = new Signal<[string, unknown]>;

    constructor(data: HexDTO) {
        this.id = data.id;
        this.name = data.name;
        this.position = CubePosition.fromAxial(data.q, data.r);
        this.model = data.model;
        this.modifiers = new ModifierContainer(this.id, ModifierParent.Hex);

        if (data.owner) {
            this.owner = this.nationRepository.getById(data.owner);
        }

        this.buildings = {
            built: data.buildings.built,
            slots: data.buildings.slots,
            planned: data.buildings.planned,
        }
    }

    public getId() {
        return this.id;
    }

    public getName() {
        return this.name;
    }

    public getOwner() {
        return this.owner;
    }

    public setOwner(owner: Nation) {
        this.owner = owner;

        this.changed.fire("owner", owner);
        this.hexDispatcher.registerUpdate(this, "owner", owner);
    }

    public getPosition() {
        return this.position;
    }

    public getNeighbors() {
        return this.neighbors;
    }

    public getModel() {
        return this.model;
    }

    public getRegion() {
        return this.region;
    }

    public setRegion(region: Region) {
        if (this.region) error("Region cannot be reassigned in runtime!");
        this.region = region;
    }

    public getBuildings() {
        return this.buildings;
    }

    public getModifiers() {
        return this.modifiers;
    }

    public setBuildings(buildings: HexBuildings) {
        this.buildings = buildings;
        this.changed.fire("buildings", buildings);
    }
}

export interface HexBuildings {
    slots: Map<Building, number>,
    planned: Map<Building, number>,
    built: Map<Building, number>,
}
