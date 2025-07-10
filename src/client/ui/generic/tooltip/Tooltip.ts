import {TooltipComponent} from "./TooltipComponent";
import {Players, ReplicatedStorage, RunService, UserInputService} from "@rbxts/services";

const template = ReplicatedStorage.WaitForChild("Assets")
    .WaitForChild("UI")
    .WaitForChild("Tooltip")
    .WaitForChild("Base") as Frame;

const screen = Players.LocalPlayer
    .WaitForChild("PlayerGui")
    .WaitForChild("Tooltips") as ScreenGui;

export interface TooltipEntry<Props> {
    class: new () => TooltipComponent<any>;
    get?: () => any;
}

export class Tooltip<Props = any> {
    private frame: Frame;
    private comps = new Array<TooltipComponent<Props>>();
    private getters: (() => any)[] = [];
    private tickConn?: RBXScriptConnection;

    constructor(entries: TooltipEntry<Props>[]) {
        this.frame = template.Clone();
        this.frame.Parent = screen;
        this.frame.Visible = false;

        entries.forEach((entry) => {
            const c = new entry.class();
            c.mount(this.frame.WaitForChild("Container") as Frame);
            this.comps.push(c);
            this.getters.push(entry.get ?? (() => ({})));
        })
    }

    public show() {
        this.update();
        this.frame.Visible = true;

        this.tickConn = RunService.RenderStepped.Connect(() => this.update());
    }

    private update() {
        for (let i = 0; i < this.comps.size(); i++) {
            this.comps[i].update(this.getters[i]());
        }

        const mouse = UserInputService.GetMouseLocation();
        this.frame.Position = UDim2.fromOffset(mouse.X + 12, mouse.Y + 12);
    }

    public hide() {
        this.tickConn?.Disconnect();
        this.frame.Visible = false;
        this.frame.Position = UDim2.fromScale(-1, -1);
    }

    public destroy() {
        this.hide();
        for (const c of this.comps) c.destroy();
        this.frame.Destroy();
    }
}