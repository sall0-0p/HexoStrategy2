export interface UIState {
    onStart?(previous?: UIState): void,
    onEnd?(next?: UIState): void,
    onTick?(dt: number): void
}