import {Order} from "./Order";
import {Unit} from "../Unit";

export class OrderQueue {
    private queue: Order[] = [];
    private isRunning = false;
    private currentOrder?: Order;

    constructor(
        private readonly unit: Unit
    ) {}

    public getCurrent(): Order | undefined {
        return this.currentOrder;
    }

    public getOrders() {
        return this.queue;
    }

    public push(order: Order) {
        this.queue.push(order);
        if (!this.isRunning) {
            this.processNext();
        }
    }

    public clear() {
        this.currentOrder?.cancel();
        this.currentOrder = undefined;
        this.queue.forEach(o => o.cancel?.());
        this.isRunning = false;
        this.queue = [];
    }

    private processNext() {
        const order = this.queue.shift();
        if (!order) {
            this.isRunning = false;
            this.currentOrder = undefined;
            return;
        }

        this.isRunning = true;
        this.currentOrder = order;
        order.execute();
        order.finished.once(() => this.processNext());
    }
}