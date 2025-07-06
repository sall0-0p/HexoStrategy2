// client/ui/components/Draggable.ts
import { UserInputService } from "@rbxts/services";

export interface DraggableOptions {
    /** override the frame’s AnchorPoint; defaults to whatever the frame had at construction */
    anchorPoint?: Vector2;
    /** override the frame’s Position; defaults to whatever the frame had at construction */
    position?: UDim2;
}

export class Draggable {
    private dragging = false;
    private dragStart = new Vector3();
    private startPos  = new UDim2();

    private beganConn?: RBXScriptConnection;
    private endedConn?: RBXScriptConnection;
    private movedConn?: RBXScriptConnection;

    private defaultAnchor: Vector2;
    private defaultPosition: UDim2;

    constructor(
        private frame: Frame,
        private handle: GuiObject,
        opts: DraggableOptions = {},
    ) {
        this.defaultAnchor   = this.frame.AnchorPoint;
        this.defaultPosition = this.frame.Position;

        this.frame.AnchorPoint = opts.anchorPoint  ?? this.defaultAnchor;
        this.frame.Position    = opts.position     ?? this.defaultPosition;

        this.beganConn = this.handle.InputBegan.Connect((input) => {
            if (input.UserInputType === Enum.UserInputType.MouseButton1) {
                this.dragging = true;
                this.dragStart = input.Position;
                this.startPos  = this.frame.Position;
            }
        });

        this.endedConn = this.handle.InputEnded.Connect((input) => {
            if (input.UserInputType === Enum.UserInputType.MouseButton1) {
                this.dragging = false;
            }
        });

        this.movedConn = UserInputService.InputChanged.Connect((input) => {
            if (!this.dragging) return;
            if (input.UserInputType !== Enum.UserInputType.MouseMovement) return;

            const delta = input.Position.sub(this.dragStart);
            this.frame.Position = new UDim2(
                this.startPos.X.Scale,
                this.startPos.X.Offset + delta.X,
                this.startPos.Y.Scale,
                this.startPos.Y.Offset + delta.Y,
            );
        });
    }

    public destroy() {
        this.beganConn?.Disconnect();
        this.endedConn?.Disconnect();
        this.movedConn?.Disconnect();
    }
}
