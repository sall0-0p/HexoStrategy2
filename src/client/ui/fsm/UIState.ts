export enum UIStateType {
    Normal = "NormalState",
    RegionConstruction = "RegionConstructionState",
}

export interface UIState {
    type: UIStateType,
    onStart?(previous?: UIState): void,
    onEnd?(nxt?: UIState): void,
    onTick?(dt: number): void
}