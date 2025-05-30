import {RunService, Workspace} from "@rbxts/services";
import {Container} from "./Container";
import {VisibleContainers} from "./VisibleContainers";

const CAM= Workspace.CurrentCamera!;
const MARGIN = 30;
export class ContainerRenderer {
    private containers = new Set<Container>();

    constructor() {
        RunService.BindToRenderStep("ContainerRendering", Enum.RenderPriority.Camera.Value - 1, () => this.onRender());
    }

    public addContainer(container: Container) {
        this.containers.add(container);
    }

    private onRender() {
        const VIEWPORT= CAM.ViewportSize;
        const minX= -MARGIN;
        const maxX= VIEWPORT.X + MARGIN;
        const minY= -MARGIN;
        const maxY= VIEWPORT.Y + MARGIN;

        this.containers.forEach((container) => {
            if (container.getFlairs().size() < 1) {
                if (container._visible) {
                    container._visible = false;
                    container.getFrame().Visible = false;
                    VisibleContainers.unmarkAsVisible(container);
                }
                return;
            }

            const [screen] = CAM.WorldToViewportPoint(container._worldPos);
            const inside = screen.X >= minX && screen.X <= maxX &&
                screen.Y >= minY && screen.Y <= maxY;

            if (inside) {
                if (!container._visible) {
                    container.getFrame().Visible = true;
                    VisibleContainers.markAsVisible(container);
                    container._visible = true;
                }

                if (screen.X !== container._lastPosition.X || screen.Y !== container._lastPosition.Y) {
                    container.getFrame().Position = UDim2.fromOffset(screen.X, screen.Y);
                    container._lastPosition = new Vector2(screen.X, screen.Y);
                }
            } else if (container._visible) {
                container._visible = false;
                container.getFrame().Visible = false;
                VisibleContainers.unmarkAsVisible(container);
            }
        })
    }
}