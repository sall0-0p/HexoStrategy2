import {Hex} from "../../world/hex/Hex";
import {Nation} from "../../world/nation/Nation";
import {UnitTemplate} from "./template/UnitTemplate";
import {UnitRepository} from "./UnitRepository";
import {Signal} from "../../../shared/classes/Signal";
import {UnitDTO} from "../../../shared/network/unit/DTO";
import {UnitReplicator} from "./UnitReplicator";
import {OrderQueue} from "./order/OrderQueue";
import {StatKey, StatsComponent} from "./components/StatsComponent";
import {UnitEquipmentComponent} from "../equipment/UnitEquipmentComponent";

export class Unit {
    // Base properties
    private id = UnitCounter.getNextId();
    private name;
    private template: UnitTemplate;
    private owner: Nation;
    private position: Hex;

    // Components
    private statsComponent: StatsComponent;
    private equipmentComponent: UnitEquipmentComponent;
    private orderQueue = new OrderQueue(this);

    // Meta
    private dead = false;
    private unitReplicator = UnitReplicator.getInstance();
    private unitRepository = UnitRepository.getInstance();

    public readonly updated: Signal<[string, unknown]> = new Signal();
    public readonly destroying: Signal<[]> = new Signal();

    constructor(template: UnitTemplate, position: Hex) {
        // Base
        this.name = template.getName();
        this.template = template;
        this.owner = template.getOwner();
        this.position = position;
        this.statsComponent = new StatsComponent(this, template);
        this.equipmentComponent = new UnitEquipmentComponent(this);

        this.unitRepository.addUnit(this);
        this.unitReplicator.addToCreateQueue(this);

        this.statsComponent.changed.connect((key, value) => {
            this.updated.fire(key, value);
        })
    }

    public die() {
        this.dead = true;
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
        this.updated.fire("name", name);
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
        this.updated.fire("owner", owner);
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
        this.updated.fire("position", position);
        this.updateModifierParents();
    }

    // Stats getters and setters
    public getSpeed(): number {
        return this.statsComponent.get(StatKey.Speed);
    }

    public setSpeed(value: number): void {
        this.statsComponent.set(StatKey.Speed, value);
    }

    public getHp(): number {
        return this.statsComponent.get(StatKey.Hp);
    }

    public setHp(value: number): void {
        this.statsComponent.set(StatKey.Hp, value);
        this.unitReplicator.markDirty(this, {
            hp: this.getHp(),
        });
    }

    public getMaxHp(): number {
        return this.statsComponent.get(StatKey.MaxHp);
    }

    public setMaxHp(value: number): void {
        this.statsComponent.set(StatKey.MaxHp, value);
        this.unitReplicator.markDirty(this, {
            maxHp: this.getMaxHp(),
        });
    }

    public getOrganisation(): number {
        return this.statsComponent.get(StatKey.Organisation);
    }

    public setOrganisation(value: number): void {
        this.statsComponent.set(StatKey.Organisation, value);
        this.unitReplicator.markDirty(this, {
            organisation: this.getOrganisation(),
        });
    }

    public getMaxOrganisation(): number {
        return this.statsComponent.get(StatKey.MaxOrganisation);
    }

    public setMaxOrganisation(value: number): void {
        this.statsComponent.set(StatKey.MaxOrganisation, value);
        this.unitReplicator.markDirty(this, {
            maxOrg: this.getMaxOrganisation(),
        });
    }

    public getRecoveryRate(): number {
        return this.statsComponent.get(StatKey.RecoveryRate);
    }

    public setRecoveryRate(value: number): void {
        this.statsComponent.set(StatKey.RecoveryRate, value);
    }

    public getSoftAttack(): number {
        return this.statsComponent.get(StatKey.SoftAttack);
    }

    public setSoftAttack(value: number): void {
        this.statsComponent.set(StatKey.SoftAttack, value);
    }

    public getHardAttack(): number {
        return this.statsComponent.get(StatKey.HardAttack);
    }

    public setHardAttack(value: number): void {
        this.statsComponent.set(StatKey.HardAttack, value);
    }

    public getDefence(): number {
        return this.statsComponent.get(StatKey.Defence);
    }

    public setDefence(value: number): void {
        this.statsComponent.set(StatKey.Defence, value);
    }

    public getBreakthrough(): number {
        return this.statsComponent.get(StatKey.Breakthrough);
    }

    public setBreakthrough(value: number): void {
        this.statsComponent.set(StatKey.Breakthrough, value);
    }

    public getArmor(): number {
        return this.statsComponent.get(StatKey.Armor);
    }

    public setArmor(value: number): void {
        this.statsComponent.set(StatKey.Armor, value);
    }

    public getPiercing(): number {
        return this.statsComponent.get(StatKey.Piercing);
    }

    public setPiercing(value: number): void {
        this.statsComponent.set(StatKey.Piercing, value);
    }

    public getInitiative(): number {
        return this.statsComponent.get(StatKey.Initiative);
    }

    public setInitiative(value: number): void {
        this.statsComponent.set(StatKey.Initiative, value);
    }

    public getCombatWidth(): number {
        return this.statsComponent.get(StatKey.CombatWidth);
    }

    public setCombatWidth(value: number): void {
        this.statsComponent.set(StatKey.CombatWidth, value);
    }

    public getHardness(): number {
        return this.statsComponent.get(StatKey.Hardness);
    }

    public setHardness(value: number): void {
        this.statsComponent.set(StatKey.Hardness, value);
    }

    public isDead() {
        return this.dead;
    }

    public getUnitType() {
        return this.template.getUnitType();
    }

    public getModifiers() {
        return this.statsComponent.getModifierContainer();
    }

    public getEquipment() {
        return this.equipmentComponent;
    }

    private updateModifierParents() {
        this.statsComponent.getModifierContainer().setParents([
            this.owner.getModifiers(),
            this.position.getModifiers(),
            this.position.getRegion().getModifiers(),
        ])
    }

    public getOrderQueue() {
        return this.orderQueue;
    }

    public toDTO(): UnitDTO {
        return {
            id: this.id,
            name: this.name,
            templateId: this.template.getId(),
            hp: this.getHp(),
            maxHp: this.getMaxHp(),
            organisation: this.getOrganisation(),
            maxOrg: this.getMaxOrganisation(),
            ownerId: this.owner.getId(),
            positionId: this.position.getId(),
            icon: this.template.getIcon(),
        } as UnitDTO;
    }
}

export class UnitCounter {
    private static currentId = 0

    public static getNextId() {
        this.currentId++
        return tostring(this.currentId);
    }
}