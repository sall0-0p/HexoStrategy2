type ControlPayloadType = "subscribe" | "unsubscribe";
export interface ControlPayload {
    type: ControlPayloadType;
    battleId: string;
}

type BattlePayloadType = "ended" | "update"
export interface BattlePayload {
    type: BattlePayloadType;
}

export interface BattleUpdate extends BattlePayload {
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

export interface BattleEnded extends BattlePayload {
    type: "ended",
    battleId: string,
}

export interface CombatantSummaryDTO {
    id: string,
    defence: number,
    breakthrough: number,
    attack: number,
    softAttack: number,
    hardAttack: number,
    armor: number,
    piercing: number,
    hardness: number,
}