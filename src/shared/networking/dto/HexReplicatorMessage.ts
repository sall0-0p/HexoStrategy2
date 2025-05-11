import {HexDTO} from "./HexDTO";

export interface HexReplicatorMessage {
    type: "full" | "update",
    payload: HexDTO[],
}