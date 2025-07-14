export interface UnitDTO {
    // base
    id: string,
    name: string,
    templateId: string,
    icon: string,
    ownerId: string, // nation id
    positionId: string, // hex id

    hp: number,
    maxHp: number,
    organisation: number,
    maxOrg: number,
}