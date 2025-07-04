import {UnitStack} from "./UnitStack";
import {Hex} from "../../../world/hex/Hex";
import {Unit} from "../../../systems/unit/Unit";
import {Container} from "./container/Container";
import {RunService} from "@rbxts/services";

export class UnitFlairManager {
    public stacks = new Map<Hex, UnitStack[]>;
    public stacksById = new Map<string, UnitStack>;
    public stacksByUnit = new Map<Unit, UnitStack>;
    public containers = new Map<Hex, Container>;

    public static instance: UnitFlairManager;
    private constructor() {}

    public addUnitToTheMap(unit: Unit) {
        let stacks = this.stacks.get(unit.getPosition());
        if (!stacks) {
            this.stacks.set(unit.getPosition(), []);
            stacks = this.stacks.get(unit.getPosition());
        }
        const stack = this.findUnitInStacks(stacks!, unit);
        if (!stack) {
            new UnitStack([unit], this, false, unit.getPosition());
        } else {
            stack.addUnit(unit);
        }
    }

    public deleteUnitFromTheMap(unit: Unit) {
        const stack = this.findStackByUnit(unit);
        stack?.removeUnit(unit);
    }

    public findStackByUnit(unit: Unit) {
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

    public updateAllColors() {
        this.stacksById.forEach((stack) => stack.updateColor());
    }

    // singleton shenanigans
    private clear() {
        this.stacksById.forEach((stack) => {
            stack.destroy();
        })
        this.containers.forEach((container) => {
            container.getFrame().Destroy();
        })
        RunService.UnbindFromRenderStep("ContainerRendering")
    }

    public static resetInstance() {
        if (!this.instance) return;
        this.instance.clear();
        this.instance = undefined!;
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new UnitFlairManager();
        }

        return this.instance;
    }
}

