// client/equipment/ClientBaseEquipmentType.ts
import { EquipmentArchetype } from "shared/constants/EquipmentArchetype";
import { EquipmentKind, EquipmentTypeDTO } from "shared/network/tether/messages/EquipmentEmitter";

export abstract class BaseEquipmentType {
    protected id: string;
    protected ownerId: string;
    protected archetype: EquipmentArchetype;
    protected name: string;
    protected icon: string;
    protected generation: number;
    protected outdated: boolean;
    protected kind: EquipmentKind;
    protected parentId?: string;

    public constructor(dto: EquipmentTypeDTO) {
        this.id = dto.id;
        this.ownerId = dto.owner; // resolve Nation on client elsewhere
        this.archetype = dto.archetype;
        this.name = dto.name;
        this.icon = dto.icon;
        this.generation = dto.generation;
        this.outdated = dto.outdated;
        this.kind = dto.kind;
        this.parentId = dto.parentId;
    }

    public getId() { return this.id; }
    public getOwnerId() { return this.ownerId; }
    public getArchetype() { return this.archetype; }
    public getName() { return this.name; }
    public getIcon() { return this.icon; }
    public getGeneration() { return this.generation; }
    public isOutdated() { return this.outdated; }
    public getKind() { return this.kind; }
    public getParentId() { return this.parentId; }

    public applyMutableFieldsFromDTO(dto: EquipmentTypeDTO) {
        this.name = dto.name;
        this.icon = dto.icon;
        this.outdated = dto.outdated;
    }
}
