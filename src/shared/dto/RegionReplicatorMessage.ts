import {RegionDTO} from "./RegionDTO";
import {HexDTO} from "./HexDTO";

export interface RegionCreateMessage {
    source: "start" | "playerAdded",
    type: "create",
    payload: RegionDTO[],
}

export interface RegionUpdateMessage {
    type: "update",
    payload: Map<string, Partial<HexDTO>>;
}

export type RegionReplicatorMessage = RegionCreateMessage | RegionUpdateMessage;