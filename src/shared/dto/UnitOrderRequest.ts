export interface UnitMoveRequest {
    request: "move",
    units: string[],
    destination: string,
}

export interface UnitHaltRequest {
    request: "halt",
    units: string[],
}

export interface UnitDeleteRequest {
    request: "delete",
    units: string[],
}

export type UnitOrderRequest = UnitMoveRequest | UnitHaltRequest;

export interface UnitOrderResponse {
    success: boolean,
}