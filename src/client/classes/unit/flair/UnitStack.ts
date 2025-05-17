import {Unit} from "../Unit";
import {Hex} from "../../hex/Hex";
import {Flair} from "./Flair";
import {Connection} from "../../../../shared/classes/Signal";
import {UnitFlairManager} from "./UnitFlairManager";

export class UnitStack {
    private units: Unit[] = [];
    private flair: Flair;
    private templateId: number;
    private hex: Hex;
    private connections = new Map<Unit, Connection[]>
    private rbxConnections = new Map<Unit, RBXScriptConnection[]>;
    private unitFlairManager: UnitFlairManager;
    private destroyed: boolean = false;

    constructor(units: Unit[], unitFlairManager: UnitFlairManager, hex?: Hex) {
        this.flair = new Flair(units[0], hex ?? units[0].getPosition(), units.size());
        this.templateId = units[0].getTemplate();
        this.hex = hex ?? units[0].getPosition();
        this.unitFlairManager = unitFlairManager;

        units.forEach((unit) => this.addUnit(unit));
    }

    public addUnit(unit: Unit) {
        if (this.destroyed) error(`Trying to add unit to destroyed stack in hex ${this.hex.getId()} with templateId ${this.templateId}`);
        if (unit.getTemplate() !== this.templateId) error("Cannot add unit with different template id into the stack!");
        this.units.push(unit);
        this.flair.setQuantity(this.units.size());
        this.updateHp();
        this.updateOrg();
        this.connections.set(unit, [unit.getChangedSignal().connect((key, value) => this.onUnitChange(unit, key, value))]);
    }

    public removeUnit(unit: Unit) {
        if (this.destroyed) error(`Trying to remove unit from destroyed stack in hex ${this.hex.getId()} with templateId ${this.templateId}`);
        this.units = this.units.filter((u) => {
            return u.getId() !== unit.getId();
        })
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
        let stacks = this.unitFlairManager.stacks.get(activeHex);
        const newStack = new UnitStack(units, this.unitFlairManager, activeHex);
        this.updateHp();
        this.updateOrg();

        if (!stacks) {
            this.unitFlairManager.stacks.set(activeHex, []);
            stacks = [];
        }
        stacks!.push(newStack);
        return newStack;
    }

    public join(stack: UnitStack) {
        if (stack.getTemplate() !== this.getTemplate()) error("Cannot merge stacks with different template ids.");
        stack.getUnits().forEach((unit) => this.addUnit(unit));
        this.updateHp();
        this.updateOrg();
        stack.destroy();
    }

    public destroy() {
        if (this.destroyed) error(`Trying to destroy destroyed stack in hex ${this.hex.getId()} with templateId ${this.templateId}`);
        this.flair.destroy();
        this.disconnectAll();
        const stacks = this.unitFlairManager.stacks.get(this.hex)!;
        this.unitFlairManager.stacks.set(this.hex, stacks.filter((stack) => {
            return stack !== this;
        }));
        this.destroyed = true;
    }

    // Changes monitoring

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
        }
    }

    private updatePosition(unit: Unit, toHex: Hex) {
        this.removeUnit(unit);

        let destStacks = this.unitFlairManager.stacks.get(toHex);
        if (!destStacks) {
            destStacks = [];
            this.unitFlairManager.stacks.set(toHex, destStacks);
        }

        let destStack = destStacks.find((stack) => stack.getTemplate() === this.templateId);
        if (!destStack) {
            destStack = new UnitStack([unit], this.unitFlairManager, toHex);
            destStacks.push(destStack);
        } else {
            destStack.addUnit(unit);
        }
    }

    private updateHp() {
        let sumHp = 0
        let sumMaxHp = 0
        this.units.forEach((unit) => {
            sumHp += unit.getHp();
            sumMaxHp += unit.getHp() * 1.2; // TODO: Replace with Maximum HP from modifiers and template.
        })

        let percentage = sumHp / sumMaxHp;
        this.flair.setHp(percentage);
    }

    private updateOrg() {
        let sumOrg = 0
        let sumMaxOrg = 0
        this.units.forEach((unit) => {
            sumOrg += unit.getOrganisation();
            sumMaxOrg += unit.getOrganisation() * 2; // TODO: Replace with Maximum HP from modifiers and template.
        })

        let percentage = sumOrg / sumMaxOrg;
        this.flair.setOrganisation(percentage);
    }

    // Misc

    private disconnectUnit(unit: Unit) {
        this.connections.get(unit)?.forEach((conn) => conn.disconnect());
        this.rbxConnections.get(unit)?.forEach((conn) => conn.Disconnect());
    }

    private disconnectAll() {
        this.connections.forEach((conns) => {
            conns.forEach((conn) => conn.disconnect());
        })

        this.rbxConnections.forEach((conns) => {
            conns.forEach((conn) => conn.Disconnect());
        })
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
}