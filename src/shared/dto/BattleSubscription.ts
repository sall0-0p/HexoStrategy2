type ControlPayloadType = "subscribe" | "unsubscribe";
export interface ControlPayload {
    type: ControlPayloadType;
    battleId: string;
}

type BattlePayloadType = "ended" | "update"
export interface BattlePayload {
    type: BattlePayloadType;
}

export interface BattleUpdate {
    type: "update",
    battleId: string,
    location: string,
    attackingLine: CombatantSummaryDTO[];
    attackingReserve: CombatantSummaryDTO[];
    defendingLine: CombatantSummaryDTO[];
    defendingReserve: CombatantSummaryDTO[];
    approximation: number;
    hoursTillEnded: number;
    maxWidth: number;
    attackingWidth: number;
    defendingWidth: number;
    attackingNation: string;
    defendingNation: string;
}

export interface BattleEnded {
    type: "ended",
    battleId: string,
}

export interface CombatantSummaryDTO {
    unitId: string,
    defence: number,
    attack: number,
}