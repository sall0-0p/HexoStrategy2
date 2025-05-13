import {CubePosition} from "../../../shared/classes/CubePosition";
import {HexDTO} from "../../../shared/dto/HexDTO";
import {Nation} from "../nation/Nation";
import {NationRepository} from "../nation/NationRepository";
import {Signal} from "../../../shared/classes/Signal";

const nationRepository = NationRepository.getInstance();

export class Hex {
    private readonly id: string;
    private readonly name: string;
    private readonly position: CubePosition;
    private owner?: Nation;
    private neighbors: Hex[] = [];
    private model?: Model;

    // events
    private changedSignal?: Signal<[string, unknown]>;

    constructor(data: HexDTO) {
        this.id = data.id;
        this.name = data.name;
        this.position = CubePosition.fromAxial(data.q, data.r);
        // this.model TODO: Find it in Models.

        if (data.owner) {
            this.owner = nationRepository.getById(data.owner);
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
    }

    public getPosition() {
        return this.position;
    }

    public getNeighbors() {
        return this.neighbors;
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
