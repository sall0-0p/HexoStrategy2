import { BaseEquipmentType } from "./BaseEquipmentType";
import { EquipmentKind, LandEquipmentDTO } from "shared/network/tether/messages/EquipmentEmitter";
import { LandEquipmentStats } from "shared/types/EquipmentStats";
import {EquipmentTypeRepository} from "../../../../server/systems/equipment/type/EquipmentTypeRepository";
import {NationRepository} from "../../../world/nation/NationRepository";

export class LandEquipmentType extends BaseEquipmentType {
    private stats: LandEquipmentStats;

    constructor(dto: LandEquipmentDTO, nationRepository: NationRepository) {
        super(dto, nationRepository);
        this.stats = { ...dto.stats };
    }

    public getStats() { return this.stats; }

    public applyUpdate(dto: LandEquipmentDTO) {
        this.applyMutableFieldsFromDTO(dto);
        this.stats = { ...dto.stats };
    }

    public static is(dto: unknown): dto is LandEquipmentDTO {
        return (dto as LandEquipmentDTO).kind === EquipmentKind.Land;
    }
}
