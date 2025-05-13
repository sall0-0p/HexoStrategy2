import {Hex} from "./Hex";
import {Signal} from "../../../shared/classes/Signal";
import {RunService} from "@rbxts/services";

interface Update {
    hex:   Hex;
    key:   string;
    value: unknown;
}

export class HexDispatcher {
    private signal = new Signal<[Update[]]>();
    private queue: Update[] = [];

    public static instance: HexDispatcher;
    private constructor() {
        RunService.Heartbeat.Connect(() => {
            if (this.queue.size() === 0) return;

            // fire a flat array
            this.signal.fire(this.queue);
            this.queue = [];
        });
    }

    public registerUpdate(hex: Hex, key: string, value: unknown) {
        this.queue.push({ hex, key, value });
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new HexDispatcher();
        }

        return this.instance;
    }
}
