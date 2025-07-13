import {UnitDTO} from "./DTO";

export interface UnitCreateMessage {
    source: "start" | "playerAdded" | "new"
    type: "create",
    payload: UnitDTO[],
}

export interface UnitUpdateMessage {
    type: "update",
    payload: Map<string, Partial<UnitDTO>>;
}

export interface UnitDeleteMessage {
    type: "delete"
    payload: string[]; // Set of ids
    died: boolean;
}

export type UnitReplicatorMessage = UnitCreateMessage | UnitUpdateMessage | UnitDeleteMessage