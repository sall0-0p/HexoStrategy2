export interface UnitDTO {
    id: number,
    name: string,
    templateId: number,
    hp: number,
    organisation: number,
    ownerId: string, // nation id
    positionId: string, // hex id
}