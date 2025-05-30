import {NationDTO} from "./NationDTO";

export interface NationCreateMessage {
    source: "start" | "playerAdded",
    type: "create",
    payload: NationDTO[];
}

export interface NationUpdateMessage {
    type: "update",
    payload: Map<string, Partial<NationDTO>>;
}

export type NationReplicatorMessage = NationCreateMessage | NationUpdateMessage;