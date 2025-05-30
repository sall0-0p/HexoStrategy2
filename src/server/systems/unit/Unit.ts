import {Hex} from "../../world/hex/Hex";
import {Nation} from "../../world/nation/Nation";
import {UnitTemplate} from "./template/UnitTemplate";
import {UnitRepository} from "./UnitRepository";
import {Connection, Signal} from "../../../shared/classes/Signal";
import {UnitDTO} from "../../../shared/dto/UnitDTO";
import {UnitReplicator} from "./UnitReplicator";
import {MovementTicker} from "./MovementTicker";

const unitReplicator = UnitReplicator.getInstance();
const unitRepository = UnitRepository.getInstance();
const movementTicker = MovementTicker.getInstance();
export class Unit {
    private id = UnitCounter.getNextId();
    private name;
    private template: UnitTemplate;
    private hp: number;
    private organisation: number;
    private owner: Nation;
    private position: Hex;

    private changedSignal?: Signal<[string, unknown]>;

    constructor(template: UnitTemplate, position: Hex) {
        this.name = template.getName();
        this.template = template;
        this.hp = template.getHp();
        this.organisation = template.getOrganisation();
        this.owner = template.getOwner();
        this.position = position;

        unitRepository.addUnit(this);
        unitReplicator.addToCreateQueue(this);
        // TODO: Replicate new unit to clients
    }

    // logic

    public moveTo(hex: Hex) {
        // This method will compute A* path from hexes, after that -> execute .move()
        // for each of them until reaching its destination,
        // while replicating progress to the client.
    }

    public move(hex: Hex) {
        // This method will move unit from hex A to its neighbor hex B, over time,
        // and if there are enemy units - engage them.
        // It will also capture territory on its way.
        const data = movementTicker.scheduleMovement(this, hex);
        const unit: Unit = this;
        const connection: Connection = data.finished.connect(() => {
            connection.disconnect();
            hex.setOwner(unit.owner);
        })

        return {
            to: data.to,
            from: data.from,
            finished: data.finished,
            cancel() {
                movementTicker.cancelMovement(unit);
                connection.disconnect();
            }
        } as ActiveMovement;
    }

    public die() {
        unitRepository.deleteUnit(this);
        unitReplicator.addToDeadQueue(this);
    }

    public delete() {
        unitRepository.deleteUnit(this);
        unitReplicator.addToDeletionQueue(this);
    }

    // getters & setters

    public getId() {
        return this.id;
    }

    public getName() {
        return this.name;
    }

    public setName(name: string) {
        this.name = name;
        unitReplicator.markDirty(this, {
            name: name,
        });
        this.changedSignal?.fire("name", name);
    }

    public getTemplate() {
        return this.template;
    }

    public getHp() {
        return this.hp;
    }

    public setHp(hp: number) {
        this.hp = hp;
        unitReplicator.markDirty(this, {
            hp: hp,
        });
        // TODO: Add upper cap and lower cap for HP
        // TODO: Implement death for no HP
        this.changedSignal?.fire("hp", hp);
    }

    public getOrganisation() {
        return this.organisation;
    }

    public setOrganisation(organisation: number) {
        this.organisation = organisation;
        unitReplicator.markDirty(this, {
            organisation: organisation,
        });
        // TODO: Add upper cap and lower cap for Org
        // TODO: Implement retreat here / in battle mechanics
        this.changedSignal?.fire("organisation", organisation);
    }

    public getOwner() {
        return this.owner;
    }

    public setOwner(owner: Nation) {
        const oldOwner = this.owner;
        this.owner = owner;
        unitReplicator.markDirty(this, {
            ownerId: owner.getId(),
        });
        unitRepository.updateUnit(this, "owner", oldOwner, owner);
        this.changedSignal?.fire("owner", owner);
    }

    public getPosition() {
        return this.position;
    }

    public setPosition(position: Hex) {
        // Use for teleporting / finishing movements. Use move() to move units between hexes.
        const oldPosition = this.position;
        this.position = position;
        unitReplicator.markDirty(this, {
            positionId: position.getId(),
        });
        unitRepository.updateUnit(this, "position", oldPosition, position);
        this.changedSignal?.fire("position", position);
    }

    public getChangedSignal() {
        if (!this.changedSignal) {
            this.changedSignal = new Signal();
        }

        return this.changedSignal;
    }

    public toDTO(): UnitDTO {
        return {
            id: this.id,
            name: this.name,
            templateId: this.template.getId(),
            hp: this.hp,
            organisation: this.organisation,
            ownerId: this.owner.getId(),
            positionId: this.position.getId(),
        } as UnitDTO;
    }
}

export interface ActiveMovement {
    to: Hex,
    from: Hex,
    cancel(): void,
    finished: Signal<[]>,
}

export class UnitCounter {
    private static currentId = 0

    public static getNextId() {
        this.currentId++
        return tostring(this.currentId);
    }
}