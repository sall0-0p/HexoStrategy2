export interface BattleDTO {

}

export interface BattleSummaryDTO {
    id: string,
    location: string, // hexId
    attackers: string[], // nationId
    defenders: string[], // nationId
    approximation: number,
    hoursTillEnded: number,
}

export interface UnitSummaryDTO {

}