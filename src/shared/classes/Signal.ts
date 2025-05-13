type Callback<Args extends unknown[]> = (...args: Args) => void;
interface Connection {
    disconnect(): void;
}

export class Signal<Args extends unknown[]> {
    private listeners = new Set<Callback<Args>>();

    public connect(fn: Callback<Args>): Connection {
        this.listeners.add(fn);

        const listeners = this.listeners
        return {
            disconnect() {
                listeners.delete(fn);
            },
        }
    }

    public fire(...args: Args) {
        this.listeners.forEach((fn) => {
            fn(...args);
        })
    }

    public clear() {
        this.listeners.clear();
    }

    public wait(): Args {
        const thread = coroutine.running();
        let conn: Connection;
        conn = this.connect((...args: Args) => {
            conn.disconnect();
            coroutine.resume(thread, ...args);
        });
        return coroutine.yield() as unknown as Args;
    }
}