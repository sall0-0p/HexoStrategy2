import {CUBE_DIRECTIONS, CubePosition} from "../../../shared/classes/CubePosition";
import {ReplicatedStorage, RunService, Workspace} from "@rbxts/services";
import {Nation} from "../nation/Nation";
import {NationRepository} from "../nation/NationRepository";
import {HexDTO} from "../../../shared/network/hex/DTO";
import {Connection, Signal} from "../../../shared/classes/Signal";
import {DirtyHexEvent, dirtyHexSignal} from "./DirtyHexSignal";
import {Region} from "../region/Region";
import {ModifierContainer} from "../../systems/modifier/ModifierContainer";
import {HexBuildingComponent} from "../building/BuildingComponent";
import {Building} from "../../../shared/data/ts/BuildingDefs";
import {HexReplicator} from "./HexReplicator";
import {ModifierParent} from "../../../shared/classes/Modifier";

const hexes = ReplicatedStorage.WaitForChild("Assets").WaitForChild("Hexes") as Folder;
const hexContainer = Workspace.WaitForChild("Hexes") as Folder;

const nationRepository = NationRepository.getInstance();
export class Hex {
    private readonly id: string;
    private readonly name: string;
    private readonly hexType: string;
    private region?: Region;
    private position: CubePosition;
    private owner?: Nation;
    private neighbors: Hex[] = [];
    private model!: Model;
    private modifiers: ModifierContainer;
    private buildings = new HexBuildingComponent(this);
    private cmUpdated?: Connection;
    
    public readonly changed = new Signal<[string, unknown]>;

    constructor(id: string, data: JsonHex) {
        this.id = id;
        this.name = data.name;
        this.position = CubePosition.fromAxial(data.q, data.r);
        this.hexType = data.hexType;
        this.modifiers = new ModifierContainer(this.id, ModifierParent.Hex);

        if (data.buildings) {
            for (const [id, count] of pairs(data.buildings)) {
                this.buildings.setBuilding(id as Building, count);
            }
        }

        if (data.owner) {
            const candidate = nationRepository.getById(data.owner);
            if (!candidate) error(`Nation with id ${data.owner} was not found!`);
            this.setOwner(candidate);
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
        const position = new CFrame(this.getWorldPos());
        model.Name = this.id;
        model.Parent = hexContainer;
        model.PivotTo(position);

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

    private onBuildingUpdate() {
        const hexReplicator = HexReplicator.getInstance();
        hexReplicator?.markAsDirty(this, {
            buildings: this.buildings.toDTO(),
        })
    }

    public toDTO(): HexDTO {
        if (!this.region) error(`Hex ${this.id} was not assigned region in initialisation stage!`);
        return {
            id: this.id,
            name: this.name,
            q: this.position.q,
            r: this.position.r,
            neighbors: this.neighbors.map((neighbor) => {
                return neighbor.id;
            }),
            buildings: this.buildings.toDTO(),
            model: this.model!,
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

    public getRegion() {
        if (!this.region) error("Regions are not initialised yet!");
        return this.region;
    }

    public setRegion(region: Region) {
        if (this.region) error(`Cannot set regions twice to hex ${this.id}! Current region: ${this.region.getId()}, new region: ${region.getId()}`);
        this.region = region;
    }

    public setOwner(owner: Nation, ignoreRegionUpdate?: boolean) {
        const prevOwner = this.owner;
        this.owner = owner;

        if (!ignoreRegionUpdate) this.region?.updateOwner();
        dirtyHexSignal.fire({
            hex: this,
            delta: {
                owner: owner.getId(),
            }
        } as DirtyHexEvent);

        this.changed.fire("owner", owner);
        this.cmUpdated?.disconnect();
        this.cmUpdated = this.owner.getConstructionManager().updated.connect(() => {
            this.onBuildingUpdate();
        });
        this.buildings.updateOwner(prevOwner, owner);
    }

    public getNeighbors() {
        return this.neighbors;
    }

    public getModel() {
        return this.model;
    }

    public getModifiers() {
        return this.modifiers;
    }

    public getBuildings() {
        return this.buildings;
    }
}

export interface JsonHex {
    name: string;
    q: number;
    r: number;
    hexType: string;
    owner?: string;
    buildings?: { [key: string]: number };
}