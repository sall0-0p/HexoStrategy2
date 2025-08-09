import {UIState} from "./UIState";
import {RunService} from "@rbxts/services";

export class UIStateMachine {
    private currentState?: UIState;

    private static instance: UIStateMachine;
    private constructor() {
        RunService.RenderStepped.Connect((dt: number) => {
            this.currentState?.onTick?.(dt);
        })
    }

    public changeTo(newState: UIState) {
        const previous = this.currentState;
        this.currentState?.onEnd?.(newState);
        this.currentState = newState;
        this.currentState.onStart?.(previous);
    }

    public getCurrentState() {
        return this.currentState;
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new UIStateMachine();
        }

        return this.instance;
    }
}