type ControlPayloadType = "subscribe" | "unsubscribe";
export interface ControlPayload {
    type: ControlPayloadType;
    battleId: string;
}

type BattlePayloadType = "ended" | "update"
export interface BattlePayload {
    type: BattlePayloadType;
}

export interface BattleEnded extends BattlePayload {
    type: "ended",
    battleId: string,
}

export interface BattleUpdate extends BattlePayload {
    type: "update",
    battleId: string,
    locationId: string,

    forces: {
        attackers: {
            frontline: CombatantSummaryDTO[];
            reserve: CombatantSummaryDTO[];
        },
        defenders: {
            frontline: CombatantSummaryDTO[];
            reserve: CombatantSummaryDTO[];
        },
    },

    prediction: {
        approximation: number;
        hoursRemaining: number;
    },

    width: {
        // Base max width
        max: number;
        base: number;
        flanks: number;

        attackers: number;
        defenders: number;
    }

    nations: {
        attackers: string[];
        defenders: string[];
    }
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