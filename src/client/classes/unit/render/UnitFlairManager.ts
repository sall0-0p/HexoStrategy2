import {ReplicatedStorage} from "@rbxts/services";
import {Unit} from "../Unit";
import {Hex} from "../../hex/Hex";

const uiAssets = ReplicatedStorage.WaitForChild("Assets")
    .WaitForChild("UI") as Folder;
const mapAssets = uiAssets.WaitForChild("Map") as Folder;

const unitFlairTemplate = mapAssets.WaitForChild("UnitFlair") as Frame;
const countryFlairTemplate = mapAssets.WaitForChild("CountryFlair") as Frame;

type UnitStack = {
    units: Unit[],
    flair: Frame,
}

export class UnitFlairManager {
    private hexUnitStacks = new Map<Hex, Map<string, UnitStack>>();

    public static instance: UnitFlairManager;
    private constructor() {

    }

    // To be implemented later with camera, so on zoom out units group together.
    public onCameraMovement() {

    }

    public addUnitToTheMap(unit: Unit) {
        const hex = unit.getPosition();
        const stackKey = this.getUnitStackKey(unit);
        if (!this.hexUnitStacks.has(hex)) {
            this.hexUnitStacks.set(hex, new Map());
        }
        const stacks = this.hexUnitStacks.get(hex)!;

        if (stacks.has(stackKey)) {
            const stackInfo = stacks.get(stackKey)!;
            stackInfo.units.push(unit);
            this.changeQuantity(stackInfo.flair, stackInfo.units.size());
            return stackInfo.flair;
        }

        const container = unit.getPosition().getModel()
            .WaitForChild("Base")
            .WaitForChild("FlairContainer", 1) as BillboardGui;

        if (!container) {
            error(`Container for flairs in hex ${unit.getPosition().getId()} was not found!`);
        }

        const flair = unitFlairTemplate.Clone();
        flair.Parent = container;

        stacks.set(stackKey, { units: [unit], flair });

        this.updateContainerSize(container);
        this.updateFlairColors(flair, unit.getOwner().getColor());
        this.updateFlags(flair, unit.getOwner().getFlag());
        this.updateUnitHp(unit);
        this.updateUnitOrganisation(unit);
        this.changeQuantity(flair, 1);

        return flair;
    }

    public updateUnitPosition(unit: Unit, oldPosition: Hex) {
        const currentStack = this.findStackByUnitInHex(unit, oldPosition);
        if (currentStack) {
            currentStack.units.remove(currentStack.units.findIndex((u) => {
                return u === unit;
            }));

            if (currentStack.units.size() > 1) {
                this.changeQuantity(currentStack.flair, currentStack.units.size());
            } else {
                const container = currentStack.flair.Parent;
                currentStack.flair.Destroy();

                if (container) {
                    this.updateContainerSize(container as BillboardGui);
                }
            }
        }

        this.addUnitToTheMap(unit);
    }

    public select(units: Unit[]) {
        
    }

    public unselect(units: Unit[]) {

    }

    public unselectAll() {

    }

    public updateUnitHp(unit: Unit) {
        // Reimplement
    }

    public updateUnitOrganisation(unit: Unit) {
        // Reimplement
    }

    public updateUnitOwner(unit: Unit) {
        // Reimplement
    }

    public deleteUnitFromTheMap(unit: Unit) {
        const hex = unit.getPosition();
        const stackKey = this.getUnitStackKey(unit);
        const stacks = this.hexUnitStacks.get(hex);
        if (!stacks || !stacks.has(stackKey)) return;

        const stackInfo = stacks.get(stackKey)!;
        stackInfo.units = stackInfo.units.filter(u => u !== unit);

        if (stackInfo.units.size() === 0) {
            stackInfo.flair.Destroy();
            stacks.delete(stackKey);
        } else {
            this.changeQuantity(stackInfo.flair, stackInfo.units.size());
        }
    }

    private updateFlairColors(flair: Frame, color: Color3) {
        (flair.WaitForChild("Body") as Frame).BackgroundColor3 = color;
        const quantityContainer = flair.WaitForChild("Body").WaitForChild("QuantityContainer", 1) as Frame;
        quantityContainer.BackgroundColor3 = color;
    }

    private updateFlags(flair: Frame, flag: string) {
        const flagLabels = flair.GetDescendants().filter((descendant: Instance) => {
            return descendant.Name === "FlagLabel" && descendant.IsA("ImageLabel");
        })

        flagLabels.forEach((label) => {
            (label as ImageLabel).Image = flag;
        })
    }

    private updateContainerSize(container: BillboardGui) {
        const childrenQuantity = container.GetChildren().size();

        container.Size = UDim2.fromOffset(60, 28 * childrenQuantity);
    }

    private changeQuantity(flair: Frame, quantity: number) {
        const label = flair.WaitForChild("Body").WaitForChild("QuantityContainer")
            .WaitForChild("Label") as TextLabel;

        label.Text = tostring(quantity);
    }

    private findStackByUnit(unit: Unit): UnitStack | undefined {
        const hex = unit.getPosition();
        const stacks = this.hexUnitStacks.get(hex);
        if (!stacks) return undefined;

        for (const [, stackInfo] of stacks) {
            if (stackInfo.units.includes(unit)) {
                return stackInfo;
            }
        }
        return undefined;
    }

    private findStackByUnitInHex(unit: Unit, hex: Hex): UnitStack | undefined {
        const stacks = this.hexUnitStacks.get(hex);
        if (!stacks) return undefined;

        for (const [, stackInfo] of stacks) {
            if (stackInfo.units.includes(unit)) {
                return stackInfo;
            }
        }
        return undefined;
    }

    private toggleOutline(flair: Frame, value: boolean) {
        const outline = flair.WaitForChild("Body").WaitForChild("Outline") as Frame;
        outline.Visible = value;
    }

    private areUnitsStackable(unitA: Unit, unitB: Unit) {
        return (
            unitA.getTemplate() === unitB.getTemplate() && // TODO: Change to .getTemplate().getId() when templates are replicated;
            unitA.getOwner() === unitB.getOwner() &&
            unitA.getHp() === unitB.getHp() &&
            unitA.getOrganisation() === unitB.getOrganisation()
        );
    }

    private getUnitStackKey(unit: Unit): string {
        return [
            unit.getTemplate(), // TODO: Change to .getTemplate().getId() when templates are replicated;
            unit.getOwner().getId(), // or name
            unit.getHp(),
            unit.getOrganisation()
            // add more if needed
        ].join("-");
    }

    // singleton shenanigans
    public static getInstance() {
        if (!this.instance) {
            this.instance = new UnitFlairManager();
        }

        return this.instance;
    }
}