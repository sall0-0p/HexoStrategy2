import {MessageEmitter} from "@rbxts/tether";
import {FactoryReservationType, FactorySourceType} from "../../classes/FactoryProviderEnums";

export const FactoryProviderEmitter = MessageEmitter.create<MessageData>();
export enum MessageType {
    ReplicateFull,
    ReplicateUsed,
}

export interface MessageData {
    [MessageType.ReplicateFull]: {
        type: "full",
        nationId: string,
        total: number,
        reserved: number,
        used: number,
        available: number,
        unallocated: number,
        sources: Map<FactorySourceType, number>;
        reservations: Map<FactoryReservationType, number>;
    },

    [MessageType.ReplicateUsed]: {
        type: "used",
        nationId: string,
        total: number,
        used: number,
    }
}