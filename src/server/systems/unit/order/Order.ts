import {Signal} from "../../../../shared/classes/Signal";

export enum OrderType {
    Movement = "Movement",
}
export interface Order {
    type: OrderType;
    finished: Signal<[]>;
    execute(): void;
    cancel(): void;
}