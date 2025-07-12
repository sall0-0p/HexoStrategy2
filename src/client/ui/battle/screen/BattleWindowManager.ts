import {BattleWindow} from "./BattleWindow";
import {BattleSubscription} from "./BattleSubscription";

export class BattleWindowManager {
    private currentWindow?: BattleWindow;
    private currentSubscription?: BattleSubscription;

    private static instance: BattleWindowManager;
    private constructor() {}

    public display(battleId: string) {
        if (this.currentSubscription || this.currentWindow) {
            this.currentSubscription?.cancel();
            this.currentWindow?.close();
        }

        this.currentSubscription = new BattleSubscription(battleId);
        this.currentWindow = new BattleWindow();

        this.currentSubscription.updated.connect((payload) =>
            this.currentWindow!.update(payload));
        this.currentSubscription.ended.connect(() => {
            this.currentWindow?.close();
        })
        this.currentWindow.closed.once(() => {
            this.currentSubscription?.cancel();
        })
    }

    public close() {
        if (!this.currentWindow || !this.currentSubscription) {
            warn("Trying to close non-existent window, aborting.");
            return;
        }

        this.currentSubscription.cancel();
        this.currentWindow.close();
    }

    // singleton shenanigans;
    private clear() {};

    public static resetInstance() {
        if (!this.instance) return;
        this.instance.clear();
        this.instance = undefined!;
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new BattleWindowManager();
        }

        return this.instance;
    }
}