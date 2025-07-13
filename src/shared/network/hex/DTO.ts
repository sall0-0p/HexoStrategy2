export interface HexDTO {
    id: string,
    name: string,
    q: number,
    r: number,
    owner?: string, // owner
    neighbors: string[], // neighbors
    model: Model,
}