import {CubePosition} from "../../../shared/classes/CubePosition";
import {HexDTO} from "../../../shared/network/hex/DTO";
import {Nation} from "../nation/Nation";
import {NationRepository} from "../nation/NationRepository";
import {Signal} from "../../../shared/classes/Signal";
import {HexDispatcher} from "./HexDispatcher";
import {Region} from "../region/Region";

export class Hex {
    private readonly id: string;
    private readonly name: string;
    private readonly position: CubePosition;
    private owner?: Nation;
    private region?: Region;
    private neighbors: Hex[] = [];
    private model: Model;

    private nationRepository = NationRepository.getInstance();
    private hexDispatcher = HexDispatcher.getInstance();

    // events
    private changedSignal?: Signal<[string, unknown]>;

    constructor(data: HexDTO) {
        this.id = data.id;
        this.name = data.name;
        this.position = CubePosition.fromAxial(data.q, data.r);
        this.model = data.model;

        if (data.owner) {
            this.owner = this.nationRepository.getById(data.owner);
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

        this.changedSignal?.fire("owner", owner);
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

    public getChangedSignal() {
        if (!this.changedSignal) {
            this.changedSignal = new Signal<[string, unknown]>();
        }

        return this.changedSignal;
    }
}

export interface HexChangedSignal {
    property: string,
    value: unknown,
}
