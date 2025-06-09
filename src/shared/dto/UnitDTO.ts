export interface UnitDTO {
    id: string,
    name: string,
    templateId: number,
    icon: string,
    hp: number,
    organisation: number,
    ownerId: string, // nation id
    positionId: string, // hex id
}