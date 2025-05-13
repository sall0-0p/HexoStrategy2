import {CubePosition} from "../../../shared/networking/classes/CubePosition";
import {HexDTO} from "../../../shared/networking/dto/HexDTO";
import {Nation} from "../nation/Nation";
import {nationRepository} from "../nation/NationRepository";

export class Hex {
    private readonly id: string;
    private readonly name: string;
    private readonly position: CubePosition;
    private owner?: Nation;
    private neighbors: Hex[] = [];
    private model?: Model;

    constructor(data: HexDTO) {
        this.id = data.id;
        this.name = data.name;
        this.position = CubePosition.fromAxial(data.q, data.r);
        // this.model TODO: Find it in Models.

        if (data.owner) {
            this.owner = nationRepository.getById(data.owner); // TODO: Change to Nation.
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

    public getPosition() {
        return this.position;
    }

    public getNeighbors() {
        return this.neighbors;
    }
}
