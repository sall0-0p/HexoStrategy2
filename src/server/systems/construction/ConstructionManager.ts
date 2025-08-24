// Per nation btw
import {Region} from "../../world/region/Region";
import {Hex} from "../../world/hex/Hex";
import {ConstructionQueue} from "./ConstructionQueue";
import {TimeSignalType, WorldTime} from "../time/WorldTime";
import {Nation} from "../../world/nation/Nation";
import {Building, BuildingDefs} from "../../../shared/data/ts/BuildingDefs";
import {Definitions} from "../../../shared/constants/Definitions";
import {ModifiableProperty} from "../../../shared/constants/ModifiableProperty";
import {BuildingProject} from "./BuildingProject";
import {Signal} from "../../../shared/classes/Signal";
import {BuildingType} from "../../../shared/types/BuildingDef";

export class ConstructionManager {
    private currentId = 0;
    private queue = new ConstructionQueue();

    public readonly updated = new Signal<[]>();

    constructor(private nation: Nation) {
        WorldTime.getInstance().on(TimeSignalType.Hour).connect(() => {
            this.tick();
        })
    }

    // Adds one building to build queue, returns of project.
    public addProject(target: Region | Hex, building: Building): BuildingProject | undefined {
        if (this.getFreeSlots(target, building) < 1) { warn("Not enough slots!"); return }

        const id = this.getNextId();
        const project = new BuildingProject(id, building, target, () => {
            this.queue.removeById(id);
        });

        this.queue.push(project);
        this.updated.fire();
        return project;
    }

    private getUsedSlots(target: Region | Hex, building: Building): number {
        const def = BuildingDefs[building];

        if (def.type === BuildingType.Shared) {
            let builtSum = 0;
            let constructingSum = 0;

            for (const [_, b] of pairs(Building)) {
                const bd = BuildingDefs[b];
                if (bd.type === BuildingType.Shared) {
                    builtSum += target.getBuildings().getBuildingCount(b);
                    constructingSum += this.getConstructing(target, b);
                }
            }
            return builtSum + constructingSum;
        }

        return target.getBuildings().getBuildingCount(building) + this.getConstructing(target, building);
    }

    public getFreeSlots(target: Region | Hex, building: Building): number {
        const component = target.getBuildings();
        const capacity = component.getSlotCount(building);
        const used = this.getUsedSlots(target, building);
        return capacity - used;
    }

    public getConstructing(target: Region | Hex, building: Building): number {
        const array = this.queue.toArray();
        return array.reduce((sum, p) => {
            if (p.target.getId() === target.getId()) {
                if (p.definition.id === building) {
                    return sum + 1;
                }
            }

            return sum;
        }, 0);
    }

    public getConstructionsIn(target: Region | Hex): BuildingProject[] {
        const array = this.queue.toArray();
        return array.filter((p) => p.target.getId() === target.getId());
    }

    public move(id: string, to: number) {
        this.queue.move(id, to);
        this.updated.fire();
    }

    public cancel(id: string) {
        const object = this.queue.toArray().find((p) => p.id === id);
        object?.cancel();
        this.updated.fire();
    }

    public getQueue() {
        return this.queue.toArray();
    }

    private tick() {
        // let factories = this.nation.getBuildings().get(Building.CivilianFactory);
        let factories = this.nation.getFactories().getAvailable();
        let usedThisTick = 0;

        const modifiers = this.nation.getModifiers();
        const baseOutput = Definitions.BaseFactoryConstructionOutput;

        const advancedThisTick = new Set<string>();

        for (const proj of this.queue.getItems()) {
            const key = `${proj.target.getId()}|${proj.type}`;
            const effectiveCost = this.getEffectiveCostFor(proj);

            if (factories > 0 && !advancedThisTick.has(key)) {
                const modifiedOutput = modifiers.getEffectiveValue(
                    baseOutput,
                    [ModifiableProperty.GlobalBuildSpeed, proj.definition.modifier]
                ) ?? 0;

                const assign = math.min(factories, Definitions.MaxFactoriesOnConstructionProject) ?? 0;
                factories -= assign;
                usedThisTick += assign;

                if (assign > 0) advancedThisTick.add(key);

                proj.advance(assign, modifiedOutput, effectiveCost, () => {
                    this.queue.removeById(proj.id);
                    this.updated.fire();
                });
            } else {
                proj.advance(0, 0, effectiveCost, () => {
                    this.queue.removeById(proj.id);
                    this.updated.fire();
                });
            }
        }

        this.nation.getFactories().updateUsedConstructions(usedThisTick);
    }

    private getNextId() {
        this.currentId++;
        return tostring(this.currentId);
    }

    private countBuilt(target: Region | Hex, building: Building): number {
        return target.getBuildings().getBuildingCount(building);
    }

    private countPlannedBefore(target: Region | Hex, building: Building, beforeId: string): number {
        let count = 0;
        for (const p of this.queue.getItems()) {
            if (p.id === beforeId) break;
            if (p.target.getId() === target.getId() && p.type === building) count++;
        }
        return count;
    }

    private getEffectiveCostFor(proj: BuildingProject): number {
        const base = proj.definition.buildCost ?? 0;
        const upgrade = proj.definition.upgradeCost ?? 0;
        if (upgrade <= 0) return base;

        const built = this.countBuilt(proj.target, proj.type);
        const plannedBefore = this.countPlannedBefore(proj.target, proj.type, proj.id);
        return base + upgrade * (built + plannedBefore);
    }
}