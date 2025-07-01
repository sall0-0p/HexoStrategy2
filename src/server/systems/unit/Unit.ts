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
import {ModifierContainer} from "../modifier/ModifierContainer";
import {ModifiableProperty} from "../modifier/ModifiableProperty";
import findPath = MovementPathfinder.findPath;
import {BattleRepository} from "../battle/BattleRepository";

const movementTicker = MovementTicker.getInstance();
export class Unit {
    // Base properties
    private id = UnitCounter.getNextId();
    private name;
    private template: UnitTemplate;
    private owner: Nation;
    private position: Hex;
    private currentMovement?: ActiveMovementOrder;
    private modifierContainer = new ModifierContainer();

    // Stats
    private speed: number;
    private hp: number;
    private maxHp: number;
    private organisation: number;
    private maxOrganisation: number;
    private recoveryRate: number;
    private softAttack: number;
    private hardAttack: number;
    private defence: number;
    private breakthrough: number;
    private armor: number;
    private piercing: number;
    private initiative: number;
    private combatWidth: number;
    private hardness: number;

    // Meta
    private dead = false;
    private unitReplicator = UnitReplicator.getInstance();
    private unitRepository = UnitRepository.getInstance();
    // private battleRepository = BattleRepository.getInstance();

    private changedSignal?: Signal<[string, unknown]>;

    constructor(template: UnitTemplate, position: Hex) {
        // Base
        this.name = template.getName();
        this.template = template;
        this.owner = template.getOwner();
        this.position = position;

        // Stats
        // Do I even need those lol
        this.speed = template.getSpeed();
        this.hp = template.getHp();
        this.maxHp = template.getHp();
        this.organisation = template.getOrganisation();
        this.maxOrganisation = template.getOrganisation();
        this.recoveryRate = template.getRecovery();
        this.softAttack = template.getSoftAttack();
        this.hardAttack = template.getHardAttack();
        this.defence = template.getDefence();
        this.breakthrough = template.getBreakthrough();
        this.armor = template.getArmor();
        this.piercing = template.getPiercing();
        this.initiative = template.getInitiative();
        this.combatWidth = template.getCombatWidth();
        this.hardness = template.getHardness();

        this.unitRepository.addUnit(this);
        this.unitReplicator.addToCreateQueue(this);
        // TODO: Replicate new unit to clients
    }

    // logic
    public moveTo(goal: Hex, retreating = false) {
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
            retreating: retreating,
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
                    relations.getRelationStatus(nextHex.getOwner()!) === DiplomaticRelationStatus.Enemy
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

    public retreat() {
        const position = this.position;
        const relations = this.getOwner().getRelations();
        const candidate = position.getNeighbors().find((neighbour) => {
            const owner = neighbour.getOwner();
            if (!owner) return true;
            return relations.getRelationStatus(owner) === DiplomaticRelationStatus.Allied || owner === this.getOwner();
        });

        if (candidate) {
            this.moveTo(candidate, true);
        } else {
            this.die();
        }
    }

    public die() {
        this.getCurrentMovemementOrder()?.cancel();
        this.dead = true;
        this.unitRepository.deleteUnit(this);
        this.unitReplicator.addToDeadQueue(this);
    }

    public delete() {
        this.unitRepository.deleteUnit(this);
        this.unitReplicator.addToDeletionQueue(this);
    }

    private updateModifierParents() {
        this.modifierContainer.setParents([
            this.owner.getModifierContainer(),
            this.position.getModifierContainer(),
            this.position.getRegion().getModifierContainer(),
        ])
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
        this.updateModifierParents();
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
        this.updateModifierParents();
    }

    // Stats getters and setters
    public getSpeed() {
        const base = this.template.getSpeed();
        const candidate = this.modifierContainer.getEffectiveValue(base, [ModifiableProperty.UnitSpeed]);

        if (candidate !== this.speed) {
            this.changedSignal?.fire("speed", candidate);
            this.speed = candidate;
        }

        return candidate;
    }

    public getHp() {
        return this.hp;
    }

    public getMaxHp() {
        // Compute based on present equipment!
        const candidate = this.template.getHp();

        if (candidate !== this.maxHp) {
            this.maxHp = candidate;
            this.changedSignal?.fire("maxHp", candidate);

            this.unitReplicator.markDirty(this, {
                maxHp: candidate,
            });
        }

        return candidate;
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

    public getMaxOrganisation() {
        const base = this.template.getOrganisation();
        const candidate = this.modifierContainer.getEffectiveValue(base, [ModifiableProperty.UnitOrganisation]);

        if (candidate !== this.maxOrganisation) {
            this.changedSignal?.fire("maxOrganisation", candidate);
            this.maxOrganisation = candidate;

            this.unitReplicator.markDirty(this, {
                maxOrg: candidate,
            });
        }

        return candidate;
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

    public getRecoveryRate() {
        const base = this.template.getRecovery();
        const candidate = this.modifierContainer.getEffectiveValue(base, [ModifiableProperty.UnitRecoveryRate]);

        if (candidate !== this.recoveryRate) {
            this.recoveryRate = candidate;
            this.changedSignal?.fire("recoveryRate", candidate);
        }

        return candidate;
    }

    public getSoftAttack() {
        const base = this.template.getSoftAttack();
        const candidate = this.modifierContainer.getEffectiveValue(base, [ModifiableProperty.UnitSoftAttack]);

        if (candidate !== this.softAttack) {
            this.softAttack = candidate;
            this.changedSignal?.fire("softAttack", candidate);
        }

        return candidate;
    }

    public getHardAttack() {
        const base = this.template.getHardAttack();
        const candidate = this.modifierContainer.getEffectiveValue(base, [ModifiableProperty.UnitHardAttack]);

        if (candidate !== this.hardAttack) {
            this.hardAttack = candidate;
            this.changedSignal?.fire("hardAttack", candidate);
        }

        return candidate;
    }

    public getDefence() {
        const base = this.template.getDefence();
        const candidate = this.modifierContainer.getEffectiveValue(base, [ModifiableProperty.UnitDefence]);

        if (candidate !== this.defence) {
            this.defence = candidate;
            this.changedSignal?.fire("defence", candidate);
        }

        return candidate;
    }

    public getBreakthrough() {
        const base = this.template.getBreakthrough();
        const candidate = this.modifierContainer.getEffectiveValue(base, [ModifiableProperty.UnitBreakthrough]);

        if (candidate !== this.breakthrough) {
            this.breakthrough = candidate;
            this.changedSignal?.fire("breakthrough", candidate);
        }

        return candidate;
    }

    public getArmor() {
        const base = this.template.getArmor();
        const candidate = this.modifierContainer.getEffectiveValue(base, [ModifiableProperty.UnitArmor]);

        if (candidate !== this.armor) {
            this.armor = candidate;
            this.changedSignal?.fire("armor", candidate);
        }

        return candidate;
    }

    public getPiercing() {
        const base = this.template.getPiercing();
        const candidate = this.modifierContainer.getEffectiveValue(base, [ModifiableProperty.UnitPiercing]);

        if (candidate !== this.piercing) {
            this.piercing = candidate;
            this.changedSignal?.fire("piercing", candidate);
        }

        return candidate;
    }

    public getInitiative() {
        const base = this.template.getInitiative();
        const candidate = this.modifierContainer.getEffectiveValue(base, [ModifiableProperty.UnitInitiative]);

        if (candidate !== this.initiative) {
            this.initiative = candidate;
            this.changedSignal?.fire("initiative", candidate);
        }

        return candidate;
    }

    public getCombatWidth() {
        const candidate = this.template.getCombatWidth();

        if (candidate !== this.combatWidth) {
            this.combatWidth = candidate;
            this.changedSignal?.fire("combatWidth", candidate);
        }

        return candidate;
    }

    public isDead() {
        return this.dead;
    }

    public getUnitType() {
        return this.template.getUnitType();
    }

    public getHardness() {
        const candidate = this.template.getHardness();

        if (candidate !== this.hardness) {
            this.hardness = candidate;
            this.changedSignal?.fire("hardness", candidate);
        }

        return candidate;
    }

    // Meta getters
    public getCurrentMovemementOrder() {
        return this.currentMovement;
    }

    public getModifiers() {
        return this.modifierContainer;
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
            maxHp: this.maxHp,
            organisation: this.organisation,
            maxOrg: this.maxOrganisation,
            ownerId: this.owner.getId(),
            positionId: this.position.getId(),
            icon: this.template.getIcon(),
        } as UnitDTO;
    }
}

interface ActiveMovement {
    to: Hex,
    from: Hex,
    retreating: boolean,
    cancel(): void,
    finished: Signal<[]>,
}

export interface ActiveMovementOrder {
    to: Hex,
    from: Hex,
    path: Hex[],
    current: Hex,
    retreating: boolean,
    cancel(): void,
}

export class UnitCounter {
    private static currentId = 0

    public static getNextId() {
        this.currentId++
        return tostring(this.currentId);
    }
}