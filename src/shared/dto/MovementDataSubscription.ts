export interface SubscribeRequest {
    units: string[];
}

export interface SubscribeResponse {
    payload: Map<string, UnitPathingData>;
}

export interface UnsubscribeRequest {
    units: string[];
}

export interface UnitPathingData {
    from: string;
    to: string;
    path: string[];
    current: string;
    progress: number;
}

export interface MovementStartedMessage {
    type: "started";
    payload: Map<string, UnitPathingData>;
}

export interface MovementUpdateMessage {
    type: "update";
    payload: Map<string, UnitPathingData>;
}

export interface MovementProgressMessage {
    type: "progress";
    payload: Map<string, Partial<UnitPathingData>>;
}

export interface MovementEndedMessage {
    type: "end";
    payload: string[];
}

export type MovementSubscriptionMessage = MovementStartedMessage | MovementUpdateMessage | MovementEndedMessage | MovementProgressMessage;