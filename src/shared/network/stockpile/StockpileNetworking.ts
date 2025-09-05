import {EquipmentArchetype} from "../../constants/EquipmentArchetype";

export enum MessageType {
    StockpileSnapshot,
    StockpileDelta,
}

export type MessageTarget = "Unit" | "Nation";
export interface StockpileEntryDTO {
    archetype: EquipmentArchetype,
    typeId: string,
    count: number,
}

export interface StockpileSnapshotDTO {
    type: MessageType.StockpileSnapshot,
    target: MessageTarget,
    targetId: string,
    entries: StockpileEntryDTO[],
}

export interface StockpileDeltaDTO {
    type: MessageType.StockpileDelta,
    target: MessageTarget,
    targetId: string,
    entries: StockpileEntryDTO[],
}