import {EquipmentArchetype} from "../../../../shared/constants/EquipmentArchetype";
import {Nation} from "../../../world/nation/Nation";
import {Signal} from "../../../../shared/classes/Signal";
import {EquipmentKind, EquipmentTypeDTO} from "../../../../shared/network/tether/messages/EquipmentEmitter";

export abstract class BaseEquipmentType {
    private id: string;
    private generation: number;
    private outdated: boolean = false;

    public readonly changed: Signal<[]> = new Signal();

    constructor(
        private readonly owner: Nation,
        private readonly archetype: EquipmentArchetype,
        private name: string,
        private icon: string,
        private kind: EquipmentKind,
        private readonly parent?: BaseEquipmentType,
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

    public getKind() {
        return this.kind;
    }

    public setName(name: string) {
        this.name = name;
        this.changed.fire();
    }

    public getIcon() {
        return this.icon;
    }

    public setIcon(icon: string) {
        this.icon = icon;
        this.changed.fire();
    }

    public isOutdated() {
        return this.outdated;
    }

    public setOutdated(outdated: boolean) {
        this.outdated = outdated;
        this.changed.fire();
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

    public toDTO(): EquipmentTypeDTO {
        error(`Base toDTO() is empty, do not use it, ${this.kind} is missing override!`);
    }
}

namespace EquipmentIdFactory {
    let currentIdCounter: number = 0;

    export function generateId(archetype: EquipmentArchetype): string {
        currentIdCounter++;
        return `${archetype as string}_${tostring(currentIdCounter)}`;
    }
}