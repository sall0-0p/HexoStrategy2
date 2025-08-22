import {GuiService, Players, ReplicatedStorage, RunService, UserInputService} from "@rbxts/services";
import {ConstructionCard} from "./ConstructionCard";

const placeholderTemplate = ReplicatedStorage.WaitForChild("Assets")
    .WaitForChild("UI")
    .WaitForChild("Construction")
    .WaitForChild("DragPlaceholder") as Frame;

export class DragOrder {
    private robloxConnections: RBXScriptConnection[] = [];
    private handle: TextButton;
    private isDragged: boolean = false;
    private placeholder?: Frame;
    private heartbeat?: RBXScriptConnection;
    private endedConnection?: RBXScriptConnection;
    private defaultSize?: UDim2;
    private absoluteSize?: Vector2;

    constructor(
        private readonly card: ConstructionCard,
        private readonly container: ScrollingFrame,
        private readonly onMove: (to: number) => void
    ) {
        this.handle = card.getFrame();
        this.handle.Destroying.Once(() => this.onDestroy());
        this.robloxConnections.push(
            this.handle.MouseButton1Down.Connect(() => this.onDragStart()));
    }

    private onDragStart() {
        this.placeholder = placeholderTemplate.Clone();
        this.placeholder.Parent = this.container;
        this.placeholder.LayoutOrder = this.handle.LayoutOrder;

        this.defaultSize = this.handle.Size;
        const absSize = this.handle.AbsoluteSize;
        this.absoluteSize = absSize;
        this.handle.Size = UDim2.fromOffset(absSize.X, absSize.Y);

        this.handle.Parent = this.getLimbo();
        this.whileDragging(0);
        // this.handle.MouseButton1Up.Once(() => this.onDragEnd());
        this.endedConnection = UserInputService.InputEnded.Connect((input: InputObject) => {
            if (input.UserInputType === Enum.UserInputType.MouseButton1) {
                this.onDragEnd();
            }
        })
        this.heartbeat = RunService.Heartbeat.Connect((dt) => this.whileDragging(dt));
    }

    private whileDragging(dt: number) {
        const mousePosition = UserInputService.GetMouseLocation();
        const top = this.container.AbsolutePosition.Y;
        const bottom = top + this.container.AbsoluteSize.Y;
        const sizeY = this.absoluteSize!.Y
        const offsetY = sizeY / 2;
        const newY = mousePosition.Y;
        const clampedY = math.clamp(newY, top + sizeY + offsetY, bottom + offsetY);

        this.updateCanvasScroll(dt);
        this.handle.Position = UDim2.fromOffset(this.placeholder?.AbsolutePosition.X ?? 0, clampedY);

        const toIndex = this.getInsertionIndex();
        if (this.placeholder) {
            this.placeholder.LayoutOrder = toIndex * 10 - 1;
        }
    }

    private onDragEnd() {
        this.placeholder?.Destroy();
        this.placeholder = undefined;

        const finalIndex = this.getInsertionIndex();

        this.handle.LayoutOrder = finalIndex * 10 - 1;
        this.handle.Parent = this.container;
        this.handle.Size = this.defaultSize ?? new UDim2(1, -6, 0, 40);
        this.endedConnection?.Disconnect();
        this.heartbeat?.Disconnect();
        this.heartbeat = undefined;

        this.onMove(finalIndex);
    }

    private onDestroy() {
        this.robloxConnections.forEach((c) => c.Disconnect());
        this.heartbeat?.Disconnect();
    }

    private getLimbo() {
        return Players.LocalPlayer.WaitForChild("PlayerGui")
            .WaitForChild("Windows")
            .WaitForChild("ConstructionWindow") as ScreenGui;
    }

    private getInsertionIndex() {
        const inset = GuiService.GetGuiInset()[0];
        const mousePos = UserInputService.GetMouseLocation();
        const cursorY = mousePos.Y - inset.Y;

        const siblings = this.container.GetChildren()
            .filter((c) => {
                return c.IsA("TextButton");
            });

        if (siblings.size() === 0) return 0;

        const first = siblings[0];
        if (cursorY < first.AbsolutePosition.Y + first.AbsoluteSize.Y / 2) {
            return 0;
        }

        siblings.sort((a, b) => a.LayoutOrder < b.LayoutOrder);

        for (let i = 0; i < siblings.size(); i++) {
            const it = siblings[i];
            const mid = it.AbsolutePosition.Y;
            if (cursorY < mid) {
                return it.LayoutOrder / 10;
            }
        }

        const last = siblings[siblings.size() - 1];
        return last.LayoutOrder / 10 + 1;
    }

    private updateCanvasScroll(dt: number) {
        const inset = GuiService.GetGuiInset()[0];
        const mousePos = UserInputService.GetMouseLocation();
        const cursorY = mousePos.Y - inset.Y;

        const top = this.container.AbsolutePosition.Y;
        const bottom = top + this.container.AbsoluteSize.Y;

        const edge = 30; // px threshold near edges
        const speed = 400; // px/sec scroll speed

        let dy = 0;
        if (cursorY < top + edge) {
            dy = -speed * dt;
        } else if (cursorY > bottom - edge) {
            dy = speed * dt;
        }

        if (dy !== 0) {
            const maxY = math.max(0, this.container.AbsoluteCanvasSize.Y - this.container.AbsoluteSize.Y);
            const newY = math.clamp(this.container.CanvasPosition.Y + dy, 0, maxY);
            this.container.CanvasPosition = new Vector2(this.container.CanvasPosition.X, newY);
        }
    }
}