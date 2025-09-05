import {BaseEquipmentType} from "./BaseEquipmentType";
import {Nation} from "../../../world/nation/Nation";
import {EquipmentArchetype} from "../../../../shared/constants/EquipmentArchetype";
import {EquipmentTypeReplicator} from "./EquipmentTypeReplicator";

export class EquipmentTypeRepository {
    private mapById: Map<string, BaseEquipmentType> = new Map();
    private mapByNation: Map<Nation, BaseEquipmentType[]> = new Map();
    private mapByArchetype: Map<EquipmentArchetype, BaseEquipmentType[]> = new Map();
    private replicator: EquipmentTypeReplicator;

    private static instance: EquipmentTypeRepository;
    private constructor() {
        this.replicator = new EquipmentTypeReplicator(this);
    }

    public register(equipmentType: BaseEquipmentType) {
        this.mapById.set(equipmentType.getId(), equipmentType);

        const nation = equipmentType.getOwner();
        if (!this.mapByNation.has(nation)) {
            this.mapByNation.set(nation, []);
        }
        this.mapByNation.get(nation)!.push(equipmentType);

        const archetype = equipmentType.getArchetype();
        if (!this.mapByArchetype.has(archetype)) {
            this.mapByArchetype.set(archetype, []);
        }
        this.mapByArchetype.get(archetype)!.push(equipmentType);

        this.replicator.replicateAdd(equipmentType);
        equipmentType.changed.connect(() =>
            this.replicator.replicateUpdate(equipmentType));
    }

    public getById(id: string) {
        return this.mapById.get(id);
    }

    public getAll() {
        const result: BaseEquipmentType[] = [];
        this.mapById.forEach((t) => {
            result.push(t);
        })
        return result;
    }

    public getAllByNation(nation: Nation) {
        return this.mapByNation.get(nation) || [];
    }

    public getAllByArchetype(archetype: EquipmentArchetype) {
        return this.mapByArchetype.get(archetype) || [];
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new EquipmentTypeRepository();
        }

        return this.instance;
    }
}