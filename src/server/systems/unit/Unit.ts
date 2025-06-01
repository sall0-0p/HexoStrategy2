import {Hex} from "../../world/hex/Hex";
import {Nation} from "../../world/nation/Nation";
import {UnitTemplate} from "./template/UnitTemplate";
import {UnitRepository} from "./UnitRepository";
import {Connection, Signal} from "../../../shared/classes/Signal";
import {UnitDTO} from "../../../shared/dto/UnitDTO";
import {UnitReplicator} from "./UnitReplicator";
import {MovementTicker} from "./MovementTicker";
import {DiplomaticRelationStatus} from "../diplomacy/DiplomaticRelation";

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
        // This method will compute A* path from hexes, after that -> execute .move()
        // for each of them until reaching its destination,
        // while replicating progress to the client.
        const start = this.getPosition();
        const path = this.findPath(start, goal);
        const unit = this;

        if (!path) {
            return;
        }

        let isCancelled = false;
        let currentConnection: Connection | undefined = undefined;
        let stepIndex = 0;

        const executeNextStep = () => {
            if (isCancelled || stepIndex >= path.size()) {
                this.currentMovement = undefined;
                return;
            }

            const nextHex = path[stepIndex];
            const data = movementTicker.scheduleMovement(this, nextHex);
            const unit: Unit = this;

            currentConnection = data.finished.connect(() => {
                currentConnection!.disconnect();
                currentConnection = undefined;

                // Change to only enemy hexes;
                nextHex.setOwner(unit.owner);

                stepIndex += 1;
                executeNextStep();
            })
        }

        executeNextStep();

        this.currentMovement = {
            to: goal,
            from: start,
            path: path,
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

    // pathfinding here
    private findPath(start: Hex, goal: Hex): Hex[] | undefined {
        const openSet = new Set<Hex>();
        openSet.add(start);

        const cameFrom = new Map<Hex, Hex>();

        const gScore = new Map<Hex, number>();
        gScore.set(start, 0);

        const fScore = new Map<Hex, number>();
        fScore.set(start, this.heuristicCost(start, goal));

        while (openSet.size() > 0) {
            let current: Hex | undefined = undefined;
            let bestF = math.huge;
            openSet.forEach((h) => {
                const score = fScore.get(h) ?? math.huge;
                if (score < bestF) {
                    bestF = score;
                    current = h;
                }
            })
            if (current === undefined) break;
            let currentDef = current as Hex;

            if (currentDef === goal) {
                return this.reconstructPath(cameFrom, current);
            }

            openSet.delete(current);

            currentDef.getNeighbors().forEach((neighbor) => {
                if (!this.isTraversable(currentDef, neighbor)) {
                    return;
                }

                const tentativeG = (gScore.get(currentDef) ?? math.huge) + this.movementCost(currentDef, neighbor);

                const prevG = gScore.get(neighbor) ?? math.huge;
                if (tentativeG < prevG) {
                    cameFrom.set(neighbor, currentDef);
                    gScore.set(neighbor, tentativeG);
                    fScore.set(neighbor, tentativeG + this.heuristicCost(neighbor, goal));
                    if (!openSet.has(neighbor)) {
                        openSet.add(neighbor);
                    }
                }
            })
        }
        return undefined;
    }

    private heuristicCost(a: Hex, b: Hex) {
        return a.getPosition().distance(b.getPosition());
    }

    private movementCost(from: Hex, to: Hex) {
        if (to.getOwner()?.getId() === this.getOwner().getId()) return 1.25;
        return 1;
    }

    private isTraversable(from: Hex, to: Hex) {
        const hexOwner = to.getOwner();
        const unitOwner = this.getOwner();

        if (hexOwner) {
            if (hexOwner.getId() === unitOwner.getId()) return true;

            const unitOwnerRelations = unitOwner.getRelations();
            const relations = unitOwnerRelations.get(hexOwner.getId());

            return (relations &&
                (relations.status === DiplomaticRelationStatus.Allied ||
                relations.status  === DiplomaticRelationStatus.Enemy)
            )
        } else {
            // Check if water or whatever.
            return true;
        }
    }

    private reconstructPath(cameFrom: Map<Hex, Hex>, current: Hex) {
        const totalPath: Hex[] = [current];
        let curr = current;
        while (cameFrom.has(curr)) {
            curr = cameFrom.get(curr)!;
            totalPath.push(curr);
        }
        const path: Hex[] = [];
        for (let i = totalPath.size() - 2; i >= 0; i--) {
            path.push(totalPath[i]);
        }

        return path;
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
    cancel(): void,
}

export class UnitCounter {
    private static currentId = 0

    public static getNextId() {
        this.currentId++
        return tostring(this.currentId);
    }
}