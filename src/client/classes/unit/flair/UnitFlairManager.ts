import {UnitStack} from "./UnitStack";
import {Hex} from "../../hex/Hex";
import {Unit} from "../Unit";

export class UnitFlairManager {
    public stacks = new Map<Hex, UnitStack[]>;

    public static instance: UnitFlairManager;
    private constructor() {

    }

    public addUnitToTheMap(unit: Unit) {
        let stacks = this.stacks.get(unit.getPosition());
        if (!stacks) {
            this.stacks.set(unit.getPosition(), []);
            stacks = this.stacks.get(unit.getPosition());
        }
        const stack = this.findUnitInStacks(stacks!, unit);
        if (!stack) {
            stacks!.push(new UnitStack([unit], this, unit.getPosition())) // Remove tostring when transition to string ids
        } else {
            stack.addUnit(unit);
        }
    }

    public deleteUnitFromTheMap(unit: Unit) {
        const stack = this.findUnitStack(unit);
        stack.removeUnit(unit);
    }

    private findUnitStack(unit: Unit) {
        const hex = unit.getPosition()
        const stacks = this.stacks.get(hex);
        if (!stacks) error(`Failed to find unit ${unit.getId()}, because stack for ${hex.getId()} is not found.`);
        const stack = this.findUnitInStacks(stacks, unit); // Remove toString when migrated to string ids for templates.
        if (!stack) error(`Failed to find unit ${unit.getId()}, because stack containing it was not found in ${hex.getId()}`);
        return stack;
    }

    private findUnitInStacks(stacks: UnitStack[], unit: Unit) {
        return stacks.find((stack) => {
            if (stack.getTemplate() === unit.getTemplate()) {
                return true;
            }
        });
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new UnitFlairManager();
        }

        return this.instance;
    }
}

