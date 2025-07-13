import {TooltipComponent} from "../TooltipComponent";
import {ReplicatedStorage} from "@rbxts/services";

const template = ReplicatedStorage.WaitForChild("Assets")
    .WaitForChild("UI")
    .WaitForChild("Tooltip")
    .WaitForChild("EmptyComponent") as TextLabel;

export class EmptyComponent implements TooltipComponent<{ height?: number }> {
    public frame!: TextLabel;

    mount(container: Frame) {
        this.frame = template.Clone();
        this.frame.Visible = false;
        this.frame.Parent = container;
    }

    update(props: { height?: number }) {
        if (props.height) {
            this.frame.Size = UDim2.fromOffset(0, props.height);
        }
        this.frame.Visible = true;
    }

    destroy() {
        this.frame.Destroy();
    }
}
