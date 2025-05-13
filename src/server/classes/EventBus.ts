// EventBus.ts
import {Hex} from "./hex/Hex";
import {HexDTO} from "../../shared/networking/dto/HexDTO";

type Handler<T> = (payload: T) => void;

class EventBus {
    private handlers = new Map<string, Set<Handler<any>>>();

    public subscribe<T>(event: string, fn: Handler<T>) {
        if (!this.handlers.has(event)) this.handlers.set(event, new Set());
        this.handlers.get(event)!.add(fn as Handler<any>);
    }

    public publish<T>(event: string, payload: T) {
        this.handlers.get(event)?.forEach(h => h(payload));
    }
}

export const eventBus = new EventBus();

// event interfaces
export interface DirtyHexEvent {
    hex: Hex;
    delta: Partial<HexDTO>;
}
