// client/equipment/ClientBaseEquipmentType.ts
import { EquipmentArchetype } from "shared/constants/EquipmentArchetype";
import { EquipmentKind, EquipmentTypeDTO } from "shared/network/tether/messages/EquipmentEmitter";
import {Nation} from "../../../world/nation/Nation";
import {NationRepository} from "../../../world/nation/NationRepository";

export abstract class BaseEquipmentType {
    protected id: string;
    protected owner: Nation;
    protected archetype: EquipmentArchetype;
    protected name: string;
    protected icon: string;
    protected generation: number;
    protected outdated: boolean;
    protected kind: EquipmentKind;
    protected parentId?: string;

    public constructor(dto: EquipmentTypeDTO, private readonly nationRepository: NationRepository) {
        this.id = dto.id;
        this.owner = this.resolveNation(dto.owner); // resolve Nation on client elsewhere
        this.archetype = dto.archetype;
        this.name = dto.name;
        this.icon = dto.icon;
        this.generation = dto.generation;
        this.outdated = dto.outdated;
        this.kind = dto.kind;
        this.parentId = dto.parentId;
    }

    private resolveNation(id: string) {
        const candidate = this.nationRepository.getById(id);
        if (!candidate) error(`Failed to query nation ${id}`);
        return candidate;
    }

    public getId() { return this.id; }
    public getOwner() { return this.owner; }
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
