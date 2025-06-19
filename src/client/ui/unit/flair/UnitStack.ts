import { Unit } from "../../../systems/unit/Unit";
import { Hex } from "../../../world/hex/Hex";
import { Flair } from "./Flair";
import { Connection } from "../../../../shared/classes/Signal";
import { UnitFlairManager } from "./UnitFlairManager";
import {NationRepository} from "../../../world/nation/NationRepository";
import {Nation} from "../../../world/nation/Nation";

export class UnitStack {
    private id: string;
    private units: Unit[] = [];
    private flair: Flair;
    private templateId: number;
    private hex: Hex;
    private selected: boolean = false;
    private relationConnection: Connection;
    private connections = new Map<Unit, Connection[]>();
    private rbxConnections = new Map<Unit, RBXScriptConnection[]>();
    private unitFlairManager: UnitFlairManager;
    private destroyed: boolean = false;

    constructor(units: Unit[], unitFlairManager: UnitFlairManager, selected: boolean, hex?: Hex) {
        this.id = StackCounter.getNextId();
        this.templateId = units[0].getTemplate();
        this.hex = hex ?? units[0].getPosition();
        this.unitFlairManager = unitFlairManager;
        this.flair = new Flair(this, units);

        units.forEach((unit) => this.addUnit(unit));

        // self‑registration moved here
        let hexStacks = this.unitFlairManager.stacks.get(this.hex);
        if (!hexStacks) {
            hexStacks = [];
            this.unitFlairManager.stacks.set(this.hex, hexStacks);
        }
        hexStacks.push(this);
        this.unitFlairManager.stacksById.set(this.id, this);

        if (selected) {
            this.setSelected(selected);
        }

        const ownerChangedSignal = units[0].getOwner().getChangedSignal();
        this.relationConnection = ownerChangedSignal.connect((prop, value) => {
            if (prop === "allies" || prop === "enemies") {
                unitFlairManager.updateAllColors();
            }
        });
    }

    public addUnit(unit: Unit) {
        if (this.destroyed) error(`Trying to add unit to destroyed stack in hex ${this.hex.getId()} with templateId ${this.templateId}`);
        if (unit.getTemplate() !== this.templateId) error("Cannot add unit with different template id into the stack!");
        this.units.push(unit);
        this.flair.setQuantity(this.units.size());
        this.updateHp();
        this.updateOrg();
        this.updateColor();
        this.unitFlairManager.stacksByUnit.set(unit, this);
        this.connections.set(unit, [unit.getChangedSignal().connect((key, value) => this.onUnitChange(unit, key, value))]);
    }

    public removeUnit(unit: Unit) {
        if (this.destroyed) error(`Trying to remove unit from destroyed stack in hex ${this.hex.getId()} with templateId ${this.templateId}`);
        this.units = this.units.filter((u) => {
            return u.getId() !== unit.getId();
        });
        this.unitFlairManager.stacksByUnit.delete(unit);
        this.updateHp();
        this.updateOrg();
        if (this.units.size() < 1) {
            this.destroy();
        } else {
            this.disconnectUnit(unit);
            this.flair.setQuantity(this.units.size());
        }
    }

    public split(units: Unit[], hex?: Hex) {
        units.forEach((unit) => this.removeUnit(unit));
        const activeHex = hex ?? this.hex;
        const newStack = new UnitStack(units, this.unitFlairManager, this.selected, activeHex);
        this.updateHp();
        this.updateOrg();
        return newStack;
    }

    public explode(selected?: boolean) {
        const activeHex = this.hex;
        const oldUnits = [...this.units];
        let results: UnitStack[] = [];

        oldUnits.forEach((unit) => {
            this.removeUnit(unit);
            const stack = new UnitStack([unit], this.unitFlairManager, this.selected, activeHex);

            if (selected) stack.setSelected(true);
            results.push(stack);
        });
        return results;
    }

    public join(stack: UnitStack) {
        if (stack.getTemplate() !== this.getTemplate()) error("Cannot merge stacks with different template ids.");
        const units = [...stack.getUnits()];
        units.forEach((unit) => stack.removeUnit(unit));
        units.forEach((unit) => this.addUnit(unit));
        this.updateHp();
        this.updateOrg();
    }

    public isMergeable(stack: UnitStack) {
        return (this.getTemplate() === stack.getTemplate()
            && this.isSelected() === stack.isSelected()
            && this.getId() !== stack.getId());
    }

    public isSelected() {
        return this.selected;
    }

    public destroy() {
        if (this.destroyed) error(`Trying to destroy destroyed stack in hex ${this.hex.getId()} with templateId ${this.templateId}`);
        this.flair.destroy();
        this.disconnectAll();
        const hexStacks = this.unitFlairManager.stacks.get(this.hex)!;
        this.unitFlairManager.stacks.set(this.hex, hexStacks.filter((stack) => {
            return stack !== this;
        }));
        this.unitFlairManager.stacksById.delete(this.getId());
        this.destroyed = true;
    }

    public setSelected(selected: boolean) {
        this.selected = selected;
        this.flair.setSelected(selected);
    }

    private onUnitChange(unit: Unit, key: string, value: unknown) {
        switch (key) {
            case "position": {
                this.updatePosition(unit, value as Hex);
                break;
            }
            case "hp": {
                this.updateHp();
                break;
            }
            case "maxHp": {
                this.updateHp();
                break;
            }
            case "organisation": {
                this.updateOrg();
                break;
            }
            case "maxOrg": {
                this.updateOrg();
                break;
            }
        }
    }

    private updatePosition(unit: Unit, toHex: Hex) {
        if (this.hex.getId() === toHex.getId()) return;
        this.removeUnit(unit);

        const hexStacks = this.unitFlairManager.stacks.get(toHex) ?? [];
        const targetStack = hexStacks.find((stack) => stack.isMergeable(this));

        if (targetStack) {
            targetStack.addUnit(unit);
        } else {
            new UnitStack([unit], this.unitFlairManager, this.selected, toHex);
        }
    }

    public updateColor() {
        const playedNationId = _G.activeNationId;
        const playedNation = NationRepository.getInstance().getById(playedNationId)!;

        const owner =  this.units[0].getOwner();
        const enemies = new Set<Nation>(playedNation.getEnemies());
        const allies = new Set<Nation>(playedNation.getAllies());

        if (playedNationId === owner.getId()) {
            this.flair.setColor(Color3.fromRGB(65, 200, 85));
        } else if (enemies.has(owner)) {
            this.flair.setColor(Color3.fromRGB(215, 95, 80));
        } else if (allies.has(owner)) {
            this.flair.setColor(Color3.fromRGB(70, 143, 215));
        } else {
            this.flair.setColor(Color3.fromRGB(180, 180, 180));
        }
    }

    private updateHp() {
        let sumHp = 0;
        let sumMaxHp = 0;
        this.units.forEach((unit) => {
            sumHp += unit.getHp();
            sumMaxHp += unit.getMaxHp(); // TODO: Replace with Maximum HP from modifiers and template.
        });

        let percentage = sumHp / sumMaxHp;
        this.flair.setHp(percentage);
    }

    private updateOrg() {
        let sumOrg = 0;
        let sumMaxOrg = 0;
        this.units.forEach((unit) => {
            sumOrg += unit.getOrganisation();
            sumMaxOrg += unit.getMaxOrg(); // TODO: Replace with Maximum HP from modifiers and template.
        });

        let percentage = sumOrg / sumMaxOrg;
        this.flair.setOrganisation(percentage);
    }

    private disconnectUnit(unit: Unit) {
        this.connections.get(unit)?.forEach((conn) => conn.disconnect());
        this.rbxConnections.get(unit)?.forEach((conn) => conn.Disconnect());
    }

    private disconnectAll() {
        this.connections.forEach((conns) => {
            conns.forEach((conn) => conn.disconnect());
        });

        this.rbxConnections.forEach((conns) => {
            conns.forEach((conn) => conn.Disconnect());
        });

        this.relationConnection.disconnect();
    }

    public getId() {
        return this.id;
    }

    public getUnits() {
        return this.units;
    }

    public getHex() {
        return this.hex;
    }

    public getTemplate() {
        return this.templateId;
    }

    public getFlair() {
        return this.flair;
    }

    public getUnitFlairManager() {
        return this.unitFlairManager;
    }
}

class StackCounter {
    private static currentId = 0;

    public static getNextId() {
        this.currentId++;
        return tostring(this.currentId);
    }
}
