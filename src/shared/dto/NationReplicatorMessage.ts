import {NationDTO} from "./NationDTO";

export interface NationReplicatorMessage {
    type: "full" | "update",
    payload: NationDTO[],
}