import { TooltipComponent } from "./TooltipComponent";
import {Players, ReplicatedStorage, RunService, UserInputService, Workspace} from "@rbxts/services";
import {TooltipDelay} from "../../../../shared/classes/TooltipDelay";

const template = ReplicatedStorage
    .WaitForChild("Assets")
    .WaitForChild("UI")
    .WaitForChild("Tooltip")
    .WaitForChild("Base") as Frame;

const screen = Players.LocalPlayer
    .WaitForChild("PlayerGui")
    .WaitForChild("Tooltips") as ScreenGui;

export interface TooltipEntry<Props> {
    class: new () => TooltipComponent<any>;
    get?: () => any;
    delay?: TooltipDelay | number;
}

type InternalEntry<Props> = {
    entry: TooltipEntry<Props>;
    getter: () => Props;
    comp?: TooltipComponent<Props>;
    mountTask?: thread;
};

export class Tooltip<Props = any> {
    private frame: Frame;
    private entries: InternalEntry<Props>[];

    private tickConn?: RBXScriptConnection;

    constructor(entries: TooltipEntry<Props>[]) {
        this.frame = template.Clone();
        this.frame.Visible = false;
        this.frame.Parent = screen;

        this.entries = entries.map(e => ({
            entry: e,
            getter: e.get ?? (() => ({} as any)),
        }));
    }

    public show() {
        this.updatePosition();
        for (const item of this.entries) {
            const delay = item.entry.delay ?? 0;
            if (delay <= 0) {
                this.mountEntry(item);
            } else {
                item.mountTask = task.delay(delay, () => this.mountEntry(item));
            }
        }

        this.updatePosition();

        this.frame.Visible = true;
        this.tickConn = RunService.RenderStepped.Connect(() => this.update());
    }

    private mountEntry(item: InternalEntry<Props>) {
        if (item.comp) return;
        const comp = new item.entry.class();
        comp.mount(this.frame.WaitForChild("Container") as Frame);
        comp.update(item.getter());
        this.updatePosition();
        item.comp = comp;
    }

    private update() {
        for (const item of this.entries) {
            if (item.comp) {
                item.comp.update(item.getter());
            }
        }
        this.updatePosition();
    }

    private updatePosition() {
        const mouse = UserInputService.GetMouseLocation();
        const size = this.frame.AbsoluteSize;
        const viewport = Workspace.CurrentCamera!.ViewportSize;

        let ax = 0;
        let ay = 0;
        let ox = 12;
        let oy = 12;

        if (mouse.X + size.X + ox > viewport.X) {
            ax = 1;
            ox = -12;
        }

        if (mouse.Y + size.Y + oy > viewport.Y) {
            ay = 1;
            oy = -12;
        }

        this.frame.AnchorPoint = new Vector2(ax, ay);
        this.frame.Position = UDim2.fromOffset(mouse.X + ox, mouse.Y + oy);
    }

    public hide() {
        this.tickConn?.Disconnect();
        for (const item of this.entries) {
            if (item.mountTask) {
                task.cancel(item.mountTask);
                item.mountTask = undefined;
            }
        }
        this.frame.Visible = false;
        this.frame.Position = UDim2.fromScale(-1, -1);
    }

    public destroy() {
        this.hide();
        for (const item of this.entries) {
            if (item.comp) {
                item.comp.destroy();
            }
        }
        this.frame.Destroy();
    }
}
