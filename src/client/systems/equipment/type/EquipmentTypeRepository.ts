// client/equipment/EquipmentTypeClientRepository.ts
import {EquipmentArchetype} from "shared/constants/EquipmentArchetype";
import {
    EquipmentKind,
    EquipmentTypeDTO,
    LandEquipmentDTO,
    MessageData,
    MessageType
} from "shared/network/tether/messages/EquipmentEmitter";
import {ClientEquipmentFactory} from "./ClientEquipmentFactory";
import {BaseEquipmentType} from "./BaseEquipmentType";
import {LandEquipmentType} from "./LandEquipmentType";
import {ReplicatedStorage} from "@rbxts/services";
import {Nation} from "../../../world/nation/Nation";
import {NationRepository} from "../../../world/nation/NationRepository";

const replicator = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("EquipmentTypeReplicator") as RemoteEvent;

export class EquipmentTypeRepository {
    private mapById = new Map<string, BaseEquipmentType>();
    private mapByOwner = new Map<Nation, BaseEquipmentType[]>();
    private mapByArchetype = new Map<EquipmentArchetype, BaseEquipmentType[]>();

    private static instance: EquipmentTypeRepository;
    private constructor(private readonly nationRepository: NationRepository) {
        replicator.OnClientEvent.Connect((payload: MessageData[MessageType.AddEquipment] | MessageData[MessageType.UpdateEquipment]) => {
            if (payload.message === MessageType.AddEquipment) {
                this.onAddMessage(payload);
            } else {
                this.onUpdateMessage(payload);
            }
        })
    }

    public static getInstance(nationRepository?: NationRepository) {
        if (!this.instance && nationRepository) this.instance = new EquipmentTypeRepository(nationRepository);

        return this.instance;
    }

    // ingest
    public onAddMessage(data: MessageData[MessageType.AddEquipment]) {
        for (const dto of data.types) this.add(dto);
    }

    public onUpdateMessage(data: MessageData[MessageType.UpdateEquipment]) {
        for (const dto of data.types) this.update(dto);
    }

    // queries
    public getById(id: string) { return this.mapById.get(id); }

    public getAll() {
        const result: BaseEquipmentType[] = [];
        this.mapById.forEach((t) => result.push(t));
        return result;
    }

    public getAllByOwner(nation: Nation) {
        const arr = this.mapByOwner.get(nation) || [];
        return [...arr];
    }

    public getAllByArchetype(archetype: EquipmentArchetype) {
        const arr = this.mapByArchetype.get(archetype) || [];
        return [...arr];
    }

    // internals
    private add(dto: EquipmentTypeDTO) {
        if (this.mapById.has(dto.id)) {
            this.update(dto);
            return;
        }
        const inst = ClientEquipmentFactory.fromDTO(dto, this.nationRepository);
        this.mapById.set(dto.id, inst);

        const nation = this.resolveNation(dto.owner)
        if (!this.mapByOwner.has(nation)) this.mapByOwner.set(nation, []);
        this.mapByOwner.get(nation)!.push(inst);

        if (!this.mapByArchetype.has(dto.archetype)) this.mapByArchetype.set(dto.archetype, []);
        this.mapByArchetype.get(dto.archetype)!.push(inst);
    }

    private update(dto: EquipmentTypeDTO) {
        const inst = this.mapById.get(dto.id);
        if (!inst) {
            this.add(dto);
            return;
        }
        if (dto.kind === EquipmentKind.Land && inst instanceof LandEquipmentType) {
            (inst as LandEquipmentType).applyUpdate(dto as LandEquipmentDTO);
        } else {
            inst.applyMutableFieldsFromDTO(dto);
        }

        const ownerArr = this.mapByOwner.get(inst.getOwner());
        if (ownerArr) {
            const idx = this.findIndexById(ownerArr, dto.id);
            if (idx !== undefined) ownerArr[idx] = inst;
            else ownerArr.push(inst);
        }

        const archArr = this.mapByArchetype.get(inst.getArchetype());
        if (archArr) {
            const idx = this.findIndexById(archArr, dto.id);
            if (idx !== undefined) archArr[idx] = inst;
            else archArr.push(inst);
        }
    }

    private resolveNation(id: string) {
        const candidate = this.nationRepository.getById(id);
        if (!candidate) error(`Failed to query nation ${id}`);
        return candidate;
    }

    private findIndexById(arr: BaseEquipmentType[], id: string): number | undefined {
        for (let i = 0; i < arr.size(); i++) if (arr[i].getId() === id) return i;
        return undefined;
    }
}
