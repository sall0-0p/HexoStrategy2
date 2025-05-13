import {CUBE_DIRECTIONS, CubePosition} from "../../../shared/classes/CubePosition";
import {Workspace, ReplicatedStorage, RunService} from "@rbxts/services";
import {Nation} from "../nation/Nation";
import {nationRepository} from "../nation/NationRepository";
import {HexDTO} from "../../../shared/dto/HexDTO";
import {Signal} from "../../../shared/classes/Signal";
import {DirtyHexEvent, dirtyHexSignal} from "./DirtyHexSignal";

const hexes = ReplicatedStorage.WaitForChild("Assets").WaitForChild("Hexes") as Folder;
const hexContainer = Workspace.WaitForChild("Hexes") as Folder;

export class Hex {
    private readonly id: string;
    private readonly name: string;
    private readonly hexType: string;
    private position: CubePosition;
    private owner?: Nation;
    private neighbors: Hex[] = [];
    private model?: Model;
    
    private changedSignal?: Signal<[string, unknown]>;

    constructor(id: string, data: JsonHex) {
        this.id = id;
        this.name = data.name;
        this.position = CubePosition.fromAxial(data.q, data.r);
        this.hexType = data.hexType;

        if (data.owner) {
            this.owner = nationRepository.getById(data.owner);
        }

        this.makeModel();
    }

    // public methods

    public getWorldPos() {
        return this.position.toWorldPos();
    }

    // private methods

    private makeModel() {
        const hexTemplate = hexes.WaitForChild(this.hexType) as Model;

        const model = hexTemplate.Clone();
        model.Name = this.id;
        model.Parent = hexContainer;
        model.PivotTo(new CFrame(this.getWorldPos()));

        this.model = model;
        if (math.random(1, 10) === 1) {
            RunService.Heartbeat.Wait();
        }
    }

    public initNeighbors(
        getByCoords: (pos: CubePosition) => Hex | undefined
    ) {
        if (this.neighbors.size() > 0) {
            error(`Neighbors for ${this.name} are already initialised.`);
        }

        for (const [dq, dr, ds] of CUBE_DIRECTIONS) {
            const neighbor = getByCoords(new CubePosition(this.position.q + dq, this.position.r + dr, this.position.s + ds));
            if (neighbor) {
                this.neighbors.push(neighbor);
            }
        }
    }

    public toDTO(): HexDTO {
        return {
            id: this.id,
            name: this.name,
            q: this.position.q,
            r: this.position.r,
            neighbors: this.neighbors.map((neighbor) => {
                return neighbor.id;
            }),
            owner: this.owner?.getId(),
        }
    }

    // Getters and setters
    public getId() {
        return this.id;
    }

    public getName() {
        return this.name;
    }

    public getPosition() {
        return this.position;
    }

    public getHexType() {
        return this.hexType;
    }

    public getOwner() {
        return this.owner;
    }

    public setOwner(owner: Nation) {
        this.owner = owner;

        dirtyHexSignal.fire({
            hex: this,
            delta: {
                owner: owner.getId(),
            }
        } as DirtyHexEvent);

        this.changedSignal?.fire("owner", owner);
    }

    public getNeighbors() {
        return this.neighbors;
    }

    public getModel() {
        return this.model;
    }

    public getChangedSignal() {
        if (!this.changedSignal) {
            this.changedSignal = new Signal();
        }

        return this.changedSignal;
    }
}

export interface JsonHex {
    name: string;
    q: number;
    r: number;
    hexType: string;
    owner?: string;
}