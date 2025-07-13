import {TooltipComponent} from "../TooltipComponent";
import {ReplicatedStorage} from "@rbxts/services";

const template = ReplicatedStorage.WaitForChild("Assets")
    .WaitForChild("UI")
    .WaitForChild("Tooltip")
    .WaitForChild("TextComponent") as TextLabel;

export class TextComponent implements TooltipComponent<{ text: string }> {
    public frame!: TextLabel;

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
