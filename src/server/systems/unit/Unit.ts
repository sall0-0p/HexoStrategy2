import {Hex} from "../../world/hex/Hex";
import {Nation} from "../../world/nation/Nation";
import {UnitTemplate} from "./template/UnitTemplate";
import {UnitRepository} from "./UnitRepository";
import {Connection, Signal} from "../../../shared/classes/Signal";
import {UnitDTO} from "../../../shared/dto/UnitDTO";
import {UnitReplicator} from "./UnitReplicator";
import {MovementTicker} from "./movement/MovementTicker";
import {DiplomaticRelationStatus} from "../diplomacy/DiplomaticRelation";
import {MovementPathfinder} from "./movement/MovementPathfinder";
import findPath = MovementPathfinder.findPath;

const movementTicker = MovementTicker.getInstance();
export class Unit {
    private id = UnitCounter.getNextId();
    private name;
    private template: UnitTemplate;
    private hp: number;
    private organisation: number;
    private owner: Nation;
    private position: Hex;
    private currentMovement?: ActiveMovementOrder;

    private unitReplicator = UnitReplicator.getInstance();
    private unitRepository = UnitRepository.getInstance();

    private changedSignal?: Signal<[string, unknown]>;

    constructor(template: UnitTemplate, position: Hex) {
        this.name = template.getName();
        this.template = template;
        this.hp = template.getHp();
        this.organisation = template.getOrganisation();
        this.owner = template.getOwner();
        this.position = position;

        this.unitRepository.addUnit(this);
        this.unitReplicator.addToCreateQueue(this);
        // TODO: Replicate new unit to clients
    }

    // logic
    public moveTo(goal: Hex) {
        if (this.currentMovement) {
            this.currentMovement.cancel();
        }

        const start = this.getPosition();
        const path = findPath(this, start, goal);
        // const path: Hex[] = [];
        const unit = this;

        if (!path) {
            return;
        }

        // fullPath.forEach((node, index) => {
        //     if (index !== 0) {
        //         path.push(node);
        //     }
        // })

        let isCancelled = false;
        let currentConnection: Connection | undefined = undefined;
        let stepIndex = 1;

        this.currentMovement = {
            to: goal,
            from: start,
            path: path,
            current: path[0],
            cancel(): void {
                isCancelled = true;
                // Cancel whichever movement is in progress, if any.
                movementTicker.cancelMovement(unit);
                if (currentConnection) {
                    currentConnection.disconnect();
                    currentConnection = undefined;
                    unit.currentMovement = undefined;
                }
            },
        };

        movementTicker.scheduleOrder(unit);

        const executeNextStep = () => {
            if (isCancelled || stepIndex >= path.size()) {
                this.currentMovement = undefined;
                movementTicker.notifyReached(this);
                return;
            }

            const nextHex = path[stepIndex];
            const data = movementTicker.scheduleMovement(this, nextHex);
            const unit: Unit = this;

            currentConnection = data.finished.connect(() => {
                currentConnection!.disconnect();
                currentConnection = undefined;

                const relations = unit.getOwner().getRelations();
                if (!nextHex.getOwner() ||
                    relations.get(nextHex.getOwner()!.getId())?.status === DiplomaticRelationStatus.Enemy
                ) {
                    nextHex.setOwner(unit.owner);
                }
                this.currentMovement!.current = nextHex;

                stepIndex += 1;
                executeNextStep();
            })
        }

        executeNextStep();
        return this.currentMovement;
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
        this.unitRepository.deleteUnit(this);
        this.unitReplicator.addToDeadQueue(this);
    }

    public delete() {
        this.unitRepository.deleteUnit(this);
        this.unitReplicator.addToDeletionQueue(this);
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
        this.unitReplicator.markDirty(this, {
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
        this.unitReplicator.markDirty(this, {
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
        this.unitReplicator.markDirty(this, {
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
        this.unitReplicator.markDirty(this, {
            ownerId: owner.getId(),
        });
        this.unitRepository.updateUnit(this, "owner", oldOwner, owner);
        this.changedSignal?.fire("owner", owner);
    }

    public getPosition() {
        return this.position;
    }

    public setPosition(position: Hex) {
        // Use for teleporting / finishing movements. Use move() to move units between hexes.
        const oldPosition = this.position;
        this.position = position;
        this.unitReplicator.markDirty(this, {
            positionId: position.getId(),
        });
        this.unitRepository.updateUnit(this, "position", oldPosition, position);
        this.changedSignal?.fire("position", position);
    }

    public getCurrentMovemementOrder() {
        return this.currentMovement;
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
            icon: this.template.getIcon(), // TODO: Move to TemplateDTO, when it is added.
        } as UnitDTO;
    }
}

interface ActiveMovement {
    to: Hex,
    from: Hex,
    cancel(): void,
    finished: Signal<[]>,
}

export interface ActiveMovementOrder {
    to: Hex,
    from: Hex,
    path: Hex[],
    current: Hex,
    cancel(): void,
}

export class UnitCounter {
    private static currentId = 0

    public static getNextId() {
        this.currentId++
        return tostring(this.currentId);
    }
}