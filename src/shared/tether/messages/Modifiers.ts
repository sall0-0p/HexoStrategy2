import {MessageEmitter} from "@rbxts/tether";
import {Modifier} from "../../classes/Modifier";

export const ModifiersEmitter = MessageEmitter.create<MessageData>();
export enum MessageType {
    ReplicateModifiers
}

export interface MessageData {
    [MessageType.ReplicateModifiers]: {
        containerId: string,
        modifiers: Modifier[],
        parentIds: string[],
    }
}