import {TooltipComponent} from "./TooltipComponent";
import {Tooltip, TooltipEntry} from "./Tooltip";

export class TooltipService {
    private active?: Tooltip;
    private binds: TooltipBind[] = [];

    private static instance: TooltipService;
    private constructor() {}

    public bind<Props>(
        target: GuiObject,
        entries: TooltipEntry<Props>[],
        hoverDelay = 0.3,
    ) {
        let hoverTask: thread;
        const enterConn = target.MouseEnter.Connect(() => {
            hoverTask = task.delay(hoverDelay, () => {
                this.active = new Tooltip(entries);
                this.active.show();
            })
        })

        const leaveConn = target.MouseLeave.Connect(() => {
            task.cancel(hoverTask);
            this.active?.hide();
            this.active?.destroy();
            this.active = undefined;
        });

        const destroyConn = target.Destroying.Connect(() => {
            unbind();
        })

        const binding = {
            target, enterConn, destroyConn, leaveConn, hoverTask: hoverTask!
        } as TooltipBind;
        this.binds.push(binding);

        // I hate this one;
        const unbind = () => {
            if (binding.hoverTask) {
                task.cancel(binding.hoverTask);
            }

            binding.enterConn.Disconnect();
            binding.leaveConn.Disconnect();
            binding.destroyConn.Disconnect();

            if (this.active) {
                this.active.hide();
                this.active.destroy();
                this.active = undefined;
            }
            this.binds = this.binds.filter(b => b !== b);
        };

        return unbind;
    }

    // singleton shenanigans
    private clear() {
        for (const b of this.binds) {
            if (b.hoverTask) task.cancel(b.hoverTask);

            b.enterConn.Disconnect();
            b.leaveConn.Disconnect();
            b.destroyConn.Disconnect();
        }
        this.binds = [];

        if (this.active) {
            this.active.hide();
            this.active.destroy();
            this.active = undefined;
        }
    };

    public static resetInstance() {
        if (!this.instance) return;
        this.instance.clear();
        this.instance = undefined!;
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new TooltipService();
        }

        return this.instance;
    }
}

interface TooltipBind {
    target: GuiObject,
    enterConn: RBXScriptConnection,
    leaveConn: RBXScriptConnection,
    destroyConn: RBXScriptConnection,
    hoverTask?: thread,
}