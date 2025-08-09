export enum UIStateType {
    Normal = "NormalState",
    RegionConstruction = "RegionConstructionState",
}

export interface UIState {
    type: UIStateType,
    onStart?(previous?: UIState): void,
    onEnd?(next?: UIState): void,
    onTick?(dt: number): void
}