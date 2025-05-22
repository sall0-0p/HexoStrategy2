import {UnitStack} from "./UnitStack";
import {Hex} from "../../hex/Hex";
import {Unit} from "../Unit";
import {Container} from "./Container";

export class UnitFlairManager {
    public stacks = new Map<Hex, UnitStack[]>;
    public stacksById = new Map<string, UnitStack>;
    public stacksByUnit = new Map<Unit, UnitStack>;
    public containers = new Map<Hex, Container>;

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
            new UnitStack([unit], this, unit.getPosition());
        } else {
            stack.addUnit(unit);
        }
    }

    public deleteUnitFromTheMap(unit: Unit) {
        const stack = this.findStackByUnit(unit);
        stack?.removeUnit(unit);
    }

    public findStackByUnit(unit: Unit) {
        // const hex = unit.getPosition()
        // const stacks = this.stacks.get(hex);
        // if (!stacks) error(`Failed to find unit ${unit.getId()}, because stack for ${hex.getId()} is not found.`);
        // const stack = this.findUnitInStacks(stacks, unit); // Remove toString when migrated to string ids for templates.
        // if (!stack) error(`Failed to find unit ${unit.getId()}, because stack containing it was not found in ${hex.getId()}`);
        // return stack;
        return this.stacksByUnit.get(unit);
    }

    private findUnitInStacks(stacks: UnitStack[], unit: Unit) {
        return stacks.find((stack) => {
            if (stack.getTemplate() === unit.getTemplate()) {
                return true;
            }
        });
    }

    public getStackById(id: string) {
        return this.stacksById.get(id);
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new UnitFlairManager();
        }

        return this.instance;
    }
}

