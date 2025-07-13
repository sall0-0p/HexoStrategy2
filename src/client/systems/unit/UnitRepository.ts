import {Unit} from "./Unit";
import {Nation} from "../../world/nation/Nation";
import {Hex} from "../../world/hex/Hex";
import {UnitDTO} from "../../../shared/network/unit/DTO";
import {UnitCreateMessage, UnitReplicatorMessage, UnitUpdateMessage} from "../../../shared/network/unit/Replicator";
import {NationRepository} from "../../world/nation/NationRepository";
import {HexRepository} from "../../world/hex/HexRepository";
import {ReplicatedStorage} from "@rbxts/services";

const replicator = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("UnitReplicator") as RemoteEvent;
const stateRequestRemote = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("StateRequests")
    .WaitForChild("GetUnitState") as RemoteFunction;

export class UnitRepository {
    private unitsById = new Map<string, Unit>;
    private unitsByOwner = new Map<Nation, Set<Unit>>;
    private unitsByHex = new Map<Hex, Set<Unit>>;

    private nationRepository = NationRepository.getInstance();
    private hexRepository = HexRepository.getInstance();

    private connection;
    private static instance: UnitRepository;
    private constructor() {
        this.requestGameState();
        this.connection = replicator.OnClientEvent.Connect((payload: UnitReplicatorMessage) => {
            this.handleMessage(payload);
        })
    }

    private requestGameState() {
        const message: UnitCreateMessage = stateRequestRemote.InvokeServer();
        this.handleMessage(message);
    }

    // queries

    public getById(id: string) {
        return this.unitsById.get(id);
    }

    public getByOwner(owner: Nation) {
        return this.unitsByOwner.get(owner);
    }

    public getByHex(hex: Hex) {
        return this.unitsByHex.get(hex);
    }

    public getAll(): Unit[] {
        let result: Unit[] = [];
        this.unitsById.forEach((unit) => {
            result.push(unit);
        })
        return result;
    }

    // handlers

    private handleMessage(message: UnitReplicatorMessage) {
        if (message.type === "create") {
            message.payload.forEach((data) => {
                this.handleCreateEvent(data);
            })
        } else if (message.type === "update") {
            message.payload.forEach((data, id) => {
                this.handleUpdateEvent(id, data);
            })
        } else if (message.type === "delete") {
            message.payload.forEach((id) => {
                this.handleDeletionEvent(id, message.died);
            })
        }
    }

    private handleCreateEvent(data: UnitDTO) {
        if (this.getById(data.id)) {
            warn(`Attempted to add unit ${data.id} to repository, but it already exists. Aborted.`);
            return;
        }

        const unit = new Unit(data);
        this.unitsById.set(unit.getId(), unit);

        if (!this.unitsByOwner.has(unit.getOwner())) {
            this.unitsByOwner.set(unit.getOwner(), new Set<Unit>);
        }
        this.unitsByOwner.get(unit.getOwner())!.add(unit);

        if (!this.unitsByHex.has(unit.getPosition())) {
            this.unitsByHex.set(unit.getPosition(), new Set<Unit>);
        }
        this.unitsByHex.get(unit.getPosition())!.add(unit);
    }

    private handleUpdateEvent(id: string, delta: Partial<UnitDTO>) {
        const unit = this.getById(id);
        if (!unit) {
            warn(`Unit ${id} not found, update packed dropped.`);
            print("Dumping:", delta);
            return;
        }

        if (delta.name) {
            unit.setName(delta.name);
        }

        if (delta.hp) {
            unit.setHp(delta.hp);
        }

        if (delta.maxHp) {
            unit.setMaxHp(delta.maxHp);
        }

        if (delta.organisation) {
            unit.setOrganisation(delta.organisation);
        }

        if (delta.maxOrg) {
            unit.setMaxOrg(delta.maxOrg);
        }

        if (delta.ownerId) {
            if (!this.nationRepository.getById(delta.ownerId)) error(`Nation ${delta.ownerId} is not found. Perhaps archives are incomplete.`);
            unit.setOwner(this.nationRepository.getById(delta.ownerId)!);
        }

        if (delta.positionId) {
            if (!this.hexRepository.getById(delta.positionId)) error(`Hex ${delta.positionId} is not found. Perhaps archives are incomplete.`);
            unit.setPosition(this.hexRepository.getById(delta.positionId)!);
        }

        // Update flairs
    }

    private handleDeletionEvent(unitId: string, died: boolean) {
        const unit = this.getById(unitId);
        if (!unit) return;

        if (died) {
            unit.die();
        } else {
            unit.delete();
        }

        this.unitsById.delete(unitId);
        this.unitsByOwner.get(unit.getOwner())?.delete(unit);
        this.unitsByHex.get(unit.getPosition())?.delete(unit);
    }

    // singleton shenanigans
    private clear() {
        this.connection.Disconnect()
    }

    public static resetInstance() {
        if (!this.instance) return;
        this.instance.clear();
        this.instance = undefined!;
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new UnitRepository();
        }

        return this.instance;
    }
}