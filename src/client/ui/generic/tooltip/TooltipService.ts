import { Players, UserInputService, RunService, GuiService, CollectionService } from "@rbxts/services";
import { Tooltip, TooltipEntry } from "./Tooltip";
import {TooltipComponent} from "./TooltipComponent";

interface TooltipBinding {
    tooltipEntries: TooltipEntry<any>[];
    hoverDelay: number;
    elapsedHoverTime: number;
    activeTooltip?: Tooltip<any>;
    unbind: () => void;
}

export class TooltipService {
    private static instance: TooltipService;
    private bindings: Map<GuiObject, TooltipBinding> = new Map();

    private constructor() {
        RunService.RenderStepped.Connect((dt) => this.update(dt));
    }

    private update(deltaTime: number) {
        const inset = GuiService.GetGuiInset()[0];
        const mousePos = UserInputService.GetMouseLocation();
        const cursorX = mousePos.X - inset.X;
        const cursorY = mousePos.Y - inset.Y;

        const playerGui = Players.LocalPlayer.WaitForChild("PlayerGui") as PlayerGui;
        const guiUnderCursor = playerGui.GetGuiObjectsAtPosition(cursorX, cursorY);

        let resolvedTarget: GuiObject | undefined;
        let blocked = false;

        for (const gui of guiUnderCursor) {
            if (this.bindings.has(gui)) {
                resolvedTarget = gui;
                break;
            }

            if (!gui.Visible) continue;
            if (gui.BackgroundTransparency === 1) continue;
            if (CollectionService.HasTag(gui, "TooltipPassthrough")) continue;

            const ancestor = guiUnderCursor.find(other =>
                this.bindings.has(other) &&
                gui.IsDescendantOf(other)
            );
            if (ancestor) {
                resolvedTarget = ancestor;
                break;
            }

            blocked = true;
            break;
        }

        this.bindings.forEach((binding, target) => {
            if (target === resolvedTarget && !blocked) {
                binding.elapsedHoverTime += deltaTime;
                if (!binding.activeTooltip && binding.elapsedHoverTime >= binding.hoverDelay) {
                    binding.activeTooltip = new Tooltip(binding.tooltipEntries);
                    binding.activeTooltip.show();
                }
            } else {
                binding.elapsedHoverTime = 0;
                if (binding.activeTooltip) {
                    binding.activeTooltip.hide();
                    binding.activeTooltip.destroy();
                    binding.activeTooltip = undefined;
                }
            }
        });
    }

    public bind<C extends TooltipComponent<any>>(
        target: GuiObject,
        entries: TooltipEntry<C>[],
        hoverDelay = 0.1,
    ): () => void {
        const binding: TooltipBinding = {
            tooltipEntries: entries as TooltipEntry<any>[],
            hoverDelay,
            elapsedHoverTime: 0,
            activeTooltip: undefined,
            unbind: () => {},
        };

        binding.unbind = () => {
            if (binding.activeTooltip) {
                binding.activeTooltip.hide();
                binding.activeTooltip.destroy();
            }
            this.bindings.delete(target);
        };

        this.bindings.set(target, binding);
        return binding.unbind;
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new TooltipService();
        }
        return this.instance;
    }

    public static resetInstance() {
        if (this.instance) {
            this.instance.bindings.forEach(b => b.unbind());
            this.instance = undefined!;
        }
    }
}
