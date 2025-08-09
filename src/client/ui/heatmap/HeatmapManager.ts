// HeatmapManager.ts
import { Heatmap, HeatmapGroup } from "./Heatmap";
import { Hex } from "../../world/hex/Hex";
import { HexRepository } from "../../world/hex/HexRepository";
import { Connection } from "../../../shared/classes/Signal";
import { RunService } from "@rbxts/services";
import {StripeManager} from "./StripeManager";

export class HeatmapManager {
    private static instance: HeatmapManager;
    private currentHeatmap?: Heatmap;
    private hexes: Hex[] = [];
    private rbxConnections = new Set<RBXScriptConnection>();
    private hexRepository = HexRepository.getInstance();
    private stripeManager = StripeManager.getInstance();

    private constructor() {
        this.hexes = this.hexRepository.getAll();
    }

    /** Show a new heatmap, tearing down any existing one */
    public showHeatmap(heatmap: Heatmap) {
        // clear out old
        if (this.currentHeatmap) {
            this.clear();
        }

        this.currentHeatmap = heatmap;

        // apply to every hex
        for (const hex of this.hexes) {
            this.updateHex(hex);
        }

        // call enable hook
        heatmap.onEnable?.();

        // connect heartbeat if needed
        if (typeOf(heatmap.onHeartbeat) === "function") {
            const hbConn = RunService.Heartbeat.Connect(() => heatmap.onHeartbeat!());
            this.rbxConnections.add(hbConn);
        }

        // connect renderstepped if needed
        if (typeOf(heatmap.onRenderStepped) === "function") {
            const rsConn = RunService.RenderStepped.Connect(() => heatmap.onRenderStepped!());
            this.rbxConnections.add(rsConn);
        }
    }

    /** Re-evaluate a single hex against the current heatmap */
    public updateHex(hex: Hex) {
        if (!this.currentHeatmap) return;

        const groupInfo = this.currentHeatmap.getGroup(hex);
        this.applyToHex(hex, groupInfo);

        const stripeInfo = this.currentHeatmap.getStripes?.(hex);
        if (stripeInfo) {
            this.stripeManager.applyToHex(hex, stripeInfo);
        }
    }

    /** Apply a HeatmapGroup’s color/transparency to the hex’s highlight meshpart */
    private applyToHex(hex: Hex, info: HeatmapGroup) {
        const model = hex.getModel();
        const highlightPart = model.FindFirstChild("Highlight") as MeshPart;
        if (!highlightPart) return;

        if (info.isHighlighted) {
            // use fillColor + fillTransparency for the mesh
            highlightPart.Color = this.applyOffsets(hex, info.fillColor);
            highlightPart.Transparency = info.fillTransparency;
        } else {
            // hide when not highlighted
            highlightPart.Transparency = 1;
        }
    }

    private applyOffsets(hex: Hex, fillColor: Color3): Color3 {
        const { r, q } = hex.getPosition();
        let boost = 0.0;

        if (r % 2 === 1 && q % 2 === 1) {
            boost = 0.2;
        } else if (r % 2 === 0 && q % 2 === 1) {
            boost = 0.1;
        }

        const nr = math.clamp(fillColor.R - boost, 0, 1);
        const ng = math.clamp(fillColor.G - boost, 0, 1);
        const nb = math.clamp(fillColor.B - boost, 0, 1);

        return new Color3(nr, ng, nb);
    }

    /** Disconnect everything and hide all hex‐highlights */
    private clear() {
        // disconnect RunService listeners
        for (const conn of this.rbxConnections) {
            conn.Disconnect();
        }
        this.rbxConnections.clear();

        // hide every hex’s highlight
        for (const hex of this.hexes) {
            const model = hex.getModel();
            const highlightPart = model.FindFirstChild("Highlight") as MeshPart;
            if (highlightPart) {
                highlightPart.Transparency = 1;
            }
        }
        this.stripeManager.clearAll();

        // call disable hook
        this.currentHeatmap?.onDisable?.();
        this.currentHeatmap = undefined;
    }

    public static resetInstance() {
        this.instance?.clear();
    }

    public static getInstance(): HeatmapManager {
        if (!HeatmapManager.instance) {
            HeatmapManager.instance = new HeatmapManager();
        }
        return HeatmapManager.instance;
    }
}
