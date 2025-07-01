type Callback<Args extends unknown[]> = (...args: Args) => void;
export interface Connection {
    disconnect(): void;
}

export class PrioritySignal<Args extends unknown[]> {
    private listeners = new Map<number, Set<Callback<Args>>>();
    private completed = false;

    public connect(fn: Callback<Args>, priority = 0): Connection {
        let set = this.listeners.get(priority);
        if (!set) {
            set = new Set();
            this.listeners.set(priority, set);
        }
        set.add(fn);

        const signal = this;
        return {
            disconnect() {
                set!.delete(fn);
                if (set!.size() === 0) {
                    signal.listeners.delete(priority);
                }
            },
        };
    }

    public fire(...args: Args) {
        const priorities: number[] = [];
        this.listeners.forEach((_, priority) => {
            priorities.push(priority);
        });

        priorities.sort((a, b) => a < b);

        for (let i = 0; i < priorities.size(); i++) {
            const pr = priorities[i];
            const set = this.listeners.get(pr);
            if (!set) continue;

            const toCall: Callback<Args>[] = [];
            set.forEach(fn => {
                toCall.push(fn);
            });

            for (let j = 0; j < toCall.size(); j++) {
                toCall[j](...args);
            }
        }
    }

    public complete() {
        this.completed = true;
    }

    public clear() {
        this.listeners.clear();
    }

    public wait(): Args | undefined {
        if (this.completed) return;
        const thread = coroutine.running();
        let conn: Connection;
        conn = this.connect((...args: Args) => {
            conn.disconnect();
            coroutine.resume(thread, ...args);
        });
        return coroutine.yield() as unknown as Args;
    }
}
