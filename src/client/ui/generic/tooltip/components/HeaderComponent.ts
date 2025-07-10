import {TooltipComponent} from "../TooltipComponent";
import {ReplicatedStorage} from "@rbxts/services";

const template = ReplicatedStorage.WaitForChild("Assets")
    .WaitForChild("UI")
    .WaitForChild("Tooltip")
    .WaitForChild("HeaderComponent") as TextLabel;

export class HeaderComponent implements TooltipComponent<{ text: string }> {
    private frame!: TextLabel;

    mount(container: Frame) {
        this.frame = template.Clone();
        this.frame.Visible = false;
        this.frame.Parent = container;
    }

    update(props: { text: string }) {
        this.frame.Text = props.text;
        this.frame.Visible = true;
    }

    destroy() {
        this.frame.Destroy();
    }
}
