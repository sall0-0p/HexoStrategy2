import {TooltipComponent} from "../TooltipComponent";
import {ReplicatedStorage} from "@rbxts/services";

const template = ReplicatedStorage.WaitForChild("Assets")
    .WaitForChild("UI")
    .WaitForChild("Tooltip")
    .WaitForChild("EmptyComponent") as TextLabel;

export class EmptyComponent implements TooltipComponent<{ height?: number }> {
    private frame!: TextLabel;

    mount(container: Frame) {
        this.frame = template.Clone();
        this.frame.Parent = container;
    }

    update(props: { height?: number }) {
        if (props.height) {
            this.frame.Size = UDim2.fromOffset(0, props.height);
        }
    }

    destroy() {
        this.frame.Destroy();
    }
}
