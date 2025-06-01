import {Unit} from "../../../systems/unit/Unit";
import {Players, UserInputService} from "@rbxts/services";
import {UnitRepository} from "../../../systems/unit/UnitRepository";
import {UnitFlairManager} from "../flair/UnitFlairManager";
import {UnitStack} from "../flair/UnitStack";

const player = Players.LocalPlayer;
const playerGui: PlayerGui = player.WaitForChild("PlayerGui") as PlayerGui;
export class SelectionManager {
    private selectedUnits: Unit[] = [];

    private unitFlairManager = UnitFlairManager.getInstance();
    private connection;
    public static instance: SelectionManager;
    private constructor() {
        this.connection = UserInputService.InputEnded.Connect((input: InputObject, processed: boolean)=> {
            if (processed) return;
            if (input.UserInputType === Enum.UserInputType.MouseButton1) {
                this.onClick(input);
            }
        });
    }

    public select(units: Unit[]) {
        if (this.selectedUnits.includes(units[0])) return;
        if (units[0]?.getOwner().getId() !== _G.activeNationId) return;

        let stacks: Set<UnitStack> = new Set();
        units.forEach((unit) => {
            const stack = this.unitFlairManager.findStackByUnit(unit);
            if (stack) stacks.add(stack);

            this.selectedUnits.push(unit);
        });

        stacks.forEach((stack) => {
            if (stack.getUnits().size() < 5) {
                stack.explode(true);
            } else {
                stack.setSelected(true);
            }
        })
    }

    public deselect(units: Unit[]) {
        const deselectSet   = new Set(units);
        const affectedStacks: Set<UnitStack> = new Set();
        this.selectedUnits = this.selectedUnits.filter((unit) => {
            if (!deselectSet.has(unit)) return true;

            const stack = this.unitFlairManager.findStackByUnit(unit);
            if (stack) {
                stack.setSelected(false);
                affectedStacks.add(stack);
            }
            return false;
        });

        affectedStacks.forEach((stack) => {
            const hex = stack.getHex();
            const stacksInHex = this.unitFlairManager.stacks.get(hex);

            if (stacksInHex) stacksInHex.some((s) => {
                if (stack.isMergeable(s)) {
                    s.join(stack);
                    return true;
                }
                return false;
            })
        })
    }

    public deselectAll() {
        this.deselect([...this.selectedUnits]);
    }

    public getSelectedUnits() {
        return this.selectedUnits;
    }

    // Handlers and utils

    private onClick(input: InputObject) {
        const position = new Vector2(input.Position.X, input.Position.Y)
        const unitsOnPosition = this.getUnitsOnPosition(position);

        // Deselect if no unit is in place :>
        if (unitsOnPosition.size() === 0) this.deselectAll();

        if (this.isShiftPressed()) {
            if (this.selectedUnits.includes(unitsOnPosition[0])) {
                this.deselect(unitsOnPosition);
            } else {
                this.select(unitsOnPosition);
            }
        } else {
            this.deselectAll();
            this.select(unitsOnPosition);
        }
    }

    private getUnitsOnPosition(pos: Vector2) {
        const guiObjects = playerGui.GetGuiObjectsAtPosition(pos.X, pos.Y);
        const flairs = guiObjects.filter((object) => {
            return object.HasTag("UnitFlair") && object.Visible;
        });

        const result: Unit[] = [];
        flairs.forEach((object) => {
            const stack = this.unitFlairManager.getStackById(object.Name);
            stack?.getUnits().forEach((unit) => {
                result.push(unit);
            })
        })

        return result;
    }

    private getStacksOnPosition(pos: Vector2) {
        const guiObjects = playerGui.GetGuiObjectsAtPosition(pos.X, pos.Y);
        const flairs = guiObjects.filter((object) => {
            return object.HasTag("UnitFlair") && object.Visible;
        });

        const result: UnitStack[] = [];
        flairs.forEach((object) => {
            const stack = this.unitFlairManager.getStackById(object.Name);
            if (stack) result.push(stack);
        })

        return result;
    }

    private isShiftPressed() {
        return UserInputService.IsKeyDown(Enum.KeyCode.LeftShift) ||
            UserInputService.IsKeyDown(Enum.KeyCode.RightShift);
    }

    // singleton shenanigans
    private clear() {
        this.connection.Disconnect();
    };

    public static resetInstance() {
        if (!this.instance) return;
        this.instance.clear();
        this.instance = new SelectionManager();
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new SelectionManager();
        }

        return this.instance
    }
}