// Per nation btw
import {Region} from "../region/Region";
import {Hex} from "../hex/Hex";
import {ConstructionQueue} from "./ConstructionQueue";
import {TimeSignalType, WorldTime} from "../../systems/time/WorldTime";
import {Nation} from "../nation/Nation";
import {Building, BuildingDefs} from "../../../shared/data/ts/BuildingDefs";
import {Definition} from "../../../shared/config/Definition";
import {ModifiableProperty} from "../../../shared/classes/ModifiableProperty";
import {BuildingProject} from "./BuildingProject";
import {Signal} from "../../../shared/classes/Signal";

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

    public getFreeSlots(target: Region | Hex, building: Building): number {
        const component = target.getBuildings();
        return component.getSlotCount(building) - this.getConstructing(target, building);
    }

    public getConstructing(target: Region | Hex, building: Building): number {
        const array = this.queue.toArray();
        return array.reduce((sum, p) => {
            if (p.target === target) {
                if (p.definition.id === building) {
                    return sum + 1;
                }
            }

            return sum;
        }, 0);
    }

    public getConstructionsIn(target: Region | Hex): BuildingProject[] {
        const array = this.queue.toArray();
        return array.filter((p) => p.target === target);
    }

    public move(id: string, to: number) {
        this.queue.move(id, to);
    }

    public cancel(id: string) {
        const object = this.queue.toArray().find((p) => p.id === id);
        object?.cancel();
    }

    public getQueue() {
        return this.queue.toArray();
    }

    private tick() {
        let factories = this.nation.getBuildings().get(Building.CivilianFactory);

        const modifiers = this.nation.getModifiers();
        const baseOutput = Definition.BaseFactoryConstructionOutput;

        for (const proj of this.queue.getItems()) {
            if (factories > 0) {
                const modifiedOutput = modifiers.getEffectiveValue(baseOutput, [ModifiableProperty.GlobalBuildSpeed, proj.definition.modifier]);
                const assign = math.min(factories, Definition.MaxFactoriesOnConstructionProject);
                factories -= assign;

                proj.advance(assign ?? 0, modifiedOutput ?? 0, () => {
                    this.queue.removeById(proj.id);
                    this.updated.fire();
                });
            } else {
                proj.advance(0, 0, () => {
                    this.queue.removeById(proj.id);
                    this.updated.fire();
                });
            }
        }
    }

    private getNextId() {
        this.currentId++;
        return tostring(this.currentId);
    }
}