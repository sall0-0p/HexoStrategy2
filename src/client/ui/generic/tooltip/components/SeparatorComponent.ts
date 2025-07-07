import {TooltipComponent} from "../TooltipComponent";
import {ReplicatedStorage} from "@rbxts/services";

const template = ReplicatedStorage.WaitForChild("Assets")
    .WaitForChild("UI")
    .WaitForChild("Tooltip")
    .WaitForChild("SeparatorComponent") as TextLabel;

export class SeparatorComponent implements TooltipComponent<{}> {
    private frame!: TextLabel;

    mount(container: Frame) {
        this.frame = template.Clone();
        this.frame.Parent = container;
    }

    update(props: {}) {

    }

    destroy() {
        this.frame.Destroy();
    }
}
