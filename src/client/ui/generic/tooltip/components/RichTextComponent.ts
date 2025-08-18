import {TooltipComponent} from "../TooltipComponent";
import {ReplicatedStorage, RunService} from "@rbxts/services";
import {defaultRegistry, parseColor, parseRich, Style, Token} from "../RichParser";

const templateFolder = ReplicatedStorage.WaitForChild("Assets")
    .WaitForChild("UI")
    .WaitForChild("Tooltip")
    .WaitForChild("RichTextComponent") as Folder;

const templateBase = templateFolder.WaitForChild("Base") as Frame;
const templateParagraph = templateFolder.WaitForChild("Paragraph") as Frame;
const templateWord = templateFolder.WaitForChild("Word") as TextLabel;
const inlineIcon = templateFolder.WaitForChild("InlineIcon") as Frame;

export class RichTextComponent implements TooltipComponent<string> {
    public frame!: Frame;
    private text = "";
    private registry = defaultRegistry();
    private currentParagraph!: Frame;

    mount(container: Frame) {
        this.frame = templateBase.Clone();
        this.frame.Visible = false;
        this.frame.Parent = container;
    }

    update(text: string) {
        if (text === this.text) return;
        this.text = text;
        this.clear();

        this.currentParagraph = this.createParagraph();
        const parsed = parseRich(text, this.registry, {
            color: Color3.fromRGB(255, 255, 255),
            bold: false,
        } as Style);
        parsed.forEach((t, i) => this.renderToken(i, t));
    }

    destroy() {
        this.frame.Destroy();
    }

    // Helpers
    private clear() {
        const children = this.frame.GetChildren();
        children.forEach((child) => {
            if (!child.IsA("UIListLayout") && !child.IsA("UISizeConstraint")) {
                child.Destroy();
            }
        })
    }

    private createParagraph(): Frame {
        const paragraph = templateParagraph.Clone();
        paragraph.Parent = this.frame;
        return paragraph;
    }

    private renderToken(index: number, token: Token) {
        if (token.kind === "text") {
            this.renderTextToken(index, token);
        } else if (token.kind === "inline") {
            this.renderIconToken(index, token);
        } else if (token.kind === "break") {
            this.currentParagraph = this.createParagraph();
            return;
        } else {
            warn(`Failed to parse:`, token);
            return;
        }
    }

    private renderTextToken(index: number, token: {
        kind: "text"
        text: string
        style: Style
    }): GuiObject {
        const word = templateWord.Clone();
        word.Text = token.style.bold ? '<b>' + token.text + '</b>' : token.text;
        word.Name = token.text;
        word.TextColor3 = token.style.color ?? Color3.fromRGB(255, 255, 255);

        word.LayoutOrder = index;
        word.Parent = this.currentParagraph;

        if (token.text === " ") {
            RunService.RenderStepped.Once(() => {
                if (word.AbsolutePosition.X === this.frame.AbsolutePosition.X) {
                    word.Destroy();
                }
            })
        }

        return word;
    }

    private renderIconToken(index: number, token: {
        kind: "inline",
        name: string,
        attributes: Map<string, string>,
        style: Style,
    }): GuiObject {
        const base = inlineIcon.Clone();
        const icon = base.WaitForChild("Image") as ImageLabel;
        icon.Image = token.attributes.get("src") ?? "rbxassetid://82855678930163";

        const colorSrt = token.attributes.get("color");
        const parsed = colorSrt ? parseColor(colorSrt) : undefined;
        icon.ImageColor3 = parsed ?? Color3.fromRGB(255, 255, 255);

        base.LayoutOrder = index;
        base.Parent = this.currentParagraph;

        return base;
    }
}
