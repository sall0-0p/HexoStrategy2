export enum DiplomaticRelationStatus {
    Neutral = 0,
    Enemy = 1,
    Allied = 2,
}

export interface DiplomaticRelation {
    status: DiplomaticRelationStatus;
}