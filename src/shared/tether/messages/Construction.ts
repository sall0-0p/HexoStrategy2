import {BuiltinMiddlewares, MessageEmitter} from "@rbxts/tether";
import {Building} from "../../data/ts/BuildingDefs";

export const ConstructionEmitter = MessageEmitter.create<MessageData>();
export enum MessageType {
    GetCurrentQueueRequest,
    GetCurrentQueueResponse,
    StartConstructionRequest,
    StartConstructionResponse,
    MoveConstructionRequest,
    MoveConstructionResponse,
    CancelConstructionRequest,
    CancelConstructionResponse,
    ConstructionProgressUpdate, // to client
    ProjectFinishedUpdate, // to client
}

export interface MessageData {
    [MessageType.GetCurrentQueueRequest]: {},

    [MessageType.GetCurrentQueueResponse]: {
        success: boolean,
        data?: CurrentProject[],
    },

    [MessageType.StartConstructionRequest]: {
        targetId: string, // HexId or RegionId
        building: Building,
    },

    [MessageType.StartConstructionResponse]: {
        success: boolean,
    },

    [MessageType.MoveConstructionRequest]: {
        constructionId: string,
        position: number,
    },

    [MessageType.MoveConstructionResponse]: {
        success: boolean,
    },

    [MessageType.CancelConstructionRequest]: {
        constructionId: string,
    },

    [MessageType.CancelConstructionResponse]: {
        success: boolean,
    },

    [MessageType.ConstructionProgressUpdate]: {
        constructionId: string,
        prediction: number,
        progress: number,
        factories: number,
    },

    [MessageType.ProjectFinishedUpdate]: {
        constructionId: string,
    }
}

export interface CurrentProject {
    id: string,
    type: Building,
    target: string, // HexId / RegionId
    progress: number,
    factories: number,
}