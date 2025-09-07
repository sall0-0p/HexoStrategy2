import {
    EquipmentKind,
    EquipmentTypeDTO,
    LandEquipmentDTO
} from "../../../../shared/network/tether/messages/EquipmentEmitter";
import {BaseEquipmentType} from "./BaseEquipmentType";
import {LandEquipmentType} from "./LandEquipmentType";
import {NationRepository} from "../../../world/nation/NationRepository";

export class ClientEquipmentFactory {
    public static fromDTO(dto: EquipmentTypeDTO, nationRepository: NationRepository): BaseEquipmentType {
        if (dto.kind === EquipmentKind.Land) return new LandEquipmentType(dto as LandEquipmentDTO, nationRepository);
        error(`Unsupported equipment kind ${tostring(dto.kind)}`);
        return undefined as unknown as BaseEquipmentType;
    }
}
