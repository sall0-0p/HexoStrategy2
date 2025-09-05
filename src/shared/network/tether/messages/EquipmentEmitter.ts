import {MessageEmitter} from "@rbxts/tether";
import {Modifier} from "../../../types/Modifier";
import {EquipmentArchetype} from "../../../constants/EquipmentArchetype";
import {LandEquipmentStats} from "../../../types/EquipmentStats";

export const EquipmentEmitter = MessageEmitter.create<MessageData>();
export enum MessageType {
    AddEquipment,
    UpdateEquipment,
}

export interface MessageData {
    [MessageType.AddEquipment]: {
        message: MessageType,
        types: EquipmentTypeDTO[];
    },
    [MessageType.UpdateEquipment]: {
        message: MessageType,
        types: EquipmentTypeDTO[];
    }
}

export enum EquipmentKind {
    Land,
    Naval,
    Air,
}
export interface BaseEquipmentDTO {
    id: string,
    owner: string,
    archetype: EquipmentArchetype,
    name: string,
    icon: string,
    generation: number,
    outdated: boolean,
    parentId?: string,
    kind: EquipmentKind,
}

export interface LandEquipmentDTO extends BaseEquipmentDTO {
    kind: EquipmentKind.Land,
    stats: LandEquipmentStats,
}

export type EquipmentTypeDTO = LandEquipmentDTO;