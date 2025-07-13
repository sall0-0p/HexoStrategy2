import {RegionDTO} from "./DTO";
import {HexDTO} from "../hex/DTO";

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