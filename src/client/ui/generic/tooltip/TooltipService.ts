import {Players, UserInputService, RunService, GuiService, CollectionService, Workspace} from "@rbxts/services";
import { Tooltip, TooltipEntry } from "./Tooltip";
import {HexRepository} from "../../../world/hex/HexRepository";
import {WorldTooltip} from "./world/WorldTooltip";

interface TooltipBinding {
    tooltipEntries: TooltipEntry<any>[];
    hoverDelay: number;
    elapsedHoverTime: number;
    activeTooltip?: Tooltip;
    unbind: () => void;
}

export class TooltipService {
    private static instance: TooltipService;
    private bindings: Map<GuiObject, TooltipBinding> = new Map();

    private worldTooltipInstance?: Tooltip;
    private worldTooltip?: WorldTooltip;
    private worldHovering = false;

    private constructor() {
        RunService.RenderStepped.Connect((dt) => this.update(dt));
        this.initWorldLoop();
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

    public bind<Props = any>(
        target: GuiObject,
        entries: TooltipEntry<any>[],
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

    // World tooltip
    public setWorldTooltip(Class: { new (s: TooltipService): WorldTooltip } | undefined) {
        if (Class) {
            this.worldTooltip = new Class(this);
        } else {
            this.worldTooltip = undefined;
        }
    }

    private initWorldLoop() {
        RunService.RenderStepped.Connect(() => {
            let active = false;
            this.bindings.forEach((b) => {
                if (b.activeTooltip) {
                    active = true;
                }
            })
            if (active) {
                this.hideWorld();
                return;
            }

            const inset = GuiService.GetGuiInset()[0];
            const m = UserInputService.GetMouseLocation();
            const guiObjects = (Players.LocalPlayer
                .WaitForChild("PlayerGui") as PlayerGui)
                .GetGuiObjectsAtPosition(m.X - inset.X, m.Y - inset.Y);
            const blocking = guiObjects.find(gui =>
                gui.Visible
                && gui.BackgroundTransparency < 1
                && !CollectionService.HasTag(gui, "TooltipPassthrough")
            );
            if (blocking) {
                this.hideWorld();
                return;
            }

            if (!this.worldTooltip) return;
            if (this.worldHovering) return;
            if (!this.getHexAtMousePosition()) return;
            const entries = this.worldTooltip.get();
            if (entries) {
                this.showWorld(entries);
            } else {
                this.hideWorld();
            }
        })
    }

    public showWorld(entries: TooltipEntry<any>[]) {
        if (this.worldHovering) return;

        this.worldHovering = true;
        this.worldTooltipInstance = new Tooltip(entries);
        this.worldTooltipInstance.show();
    }

    public hideWorld() {
        if (!this.worldHovering) return;

        this.worldHovering = false;
        if (this.worldTooltipInstance) {
            this.worldTooltipInstance.hide();
            this.worldTooltipInstance.destroy();
            this.worldTooltipInstance = undefined;
        }
    }

    public getHexAtMousePosition() {
        const camera = Workspace.CurrentCamera;
        if (!camera) return;

        const mouse = UserInputService.GetMouseLocation();
        const unitRay = camera.ViewportPointToRay(mouse.X, mouse.Y);
        const params = new RaycastParams();
        params.FilterType = Enum.RaycastFilterType.Include;
        params.FilterDescendantsInstances = CollectionService.GetTagged("HexBase");

        const hit = Workspace.Raycast(unitRay.Origin, unitRay.Direction.mul(1000), params);
        if (!hit || !hit.Instance) return;
        const id = hit.Instance.FindFirstAncestorOfClass("Model")?.Name
        if (!id) return;

        const repo = HexRepository.getInstance();
        return repo.getById(id);
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
