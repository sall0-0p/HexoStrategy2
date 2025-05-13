import {HexDTO} from "./HexDTO";

export interface HexCreateMessage {
    source: "start" | "playerAdded"
    type: "create",
    payload: HexDTO[],
}

export interface HexUpdateMessage {
    type: "update",
    payload: Map<string, Partial<HexDTO>>,
}