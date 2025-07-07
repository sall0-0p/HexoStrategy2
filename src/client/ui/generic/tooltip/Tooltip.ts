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
    componentClass: new () => TooltipComponent<Props>;
    getProps: () => Props;
}

export class Tooltip<Props = any> {
    private frame: Frame;
    private comps = new Array<TooltipComponent<Props>>();
    private getProps: () => Props;
    private tickConn?: RBXScriptConnection;

    constructor(components: (new () => TooltipComponent<Props>)[],
                getProps: () => Props) {
        this.getProps = getProps;

        this.frame = template.Clone();
        this.frame.Parent = screen;
        this.frame.Visible = false;

        components.forEach((Comp) => {
            const component = new Comp();
            component.mount(this.frame.WaitForChild("Container") as Frame);
            this.comps.push(component);
        })
    }

    public show() {
        this.frame.Visible = true;

        this.tickConn = RunService.RenderStepped.Connect(() => {
            const props = this.getProps();
            this.comps.forEach((c) => c.update(props));
            const mouse = UserInputService.GetMouseLocation();
            this.frame.Position = UDim2.fromOffset(mouse.X + 10, mouse.Y + 10);
        })
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