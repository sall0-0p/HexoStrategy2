import {EquipmentArchetype} from "../../../../shared/constants/EquipmentArchetype";
import {Nation} from "../../../world/nation/Nation";

export abstract class EquipmentType {
    private id: string;
    private generation: number;
    private outdated: boolean = false;

    constructor(
        private readonly owner: Nation,
        private readonly archetype: EquipmentArchetype,
        private name: string,
        private icon: string,
        private readonly parent?: EquipmentType,
    ) {
        this.id = EquipmentIdFactory.generateId(archetype);

        if (this.parent) {
            this.generation = this.parent.getGeneration() + 1;
        } else {
            this.generation = 0;
        }
    }

    public getId() {
        return this.id;
    }

    public getGeneration() {
        return this.generation;
    }

    public getName() {
        return this.name;
    }

    public setName(name: string) {
        return this.name;
    }

    public getIcon() {
        return this.icon;
    }

    public setIcon(icon: string) {
        this.icon = icon;
    }

    public isOutdated() {
        return this.outdated;
    }

    public setOutdated(outdated: boolean) {
        this.outdated = outdated;
    }

    public getParent() {
        return this.parent;
    }

    public getOwner() {
        return this.owner;
    }

    public getArchetype() {
        return this.archetype;
    }
}

namespace EquipmentIdFactory {
    let currentIdCounter: number = 0;

    export function generateId(archetype: EquipmentArchetype): string {
        currentIdCounter++;
        return `(archetype as string)_${tostring(currentIdCounter)}`;
    }
}