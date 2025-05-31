import { Heatmap, HeatmapGroup } from "./Heatmap";
import { Hex } from "../../world/hex/Hex";
import { HexRepository } from "../../world/hex/HexRepository";
import { Connection } from "../../../shared/classes/Signal";
import { RunService, Workspace } from "@rbxts/services";

const hexRepository = HexRepository.getInstance();
const heatmapContainer = Workspace.WaitForChild("Heatmaps") as Folder;

interface Group {
    info: HeatmapGroup;
    map: Map<string, Hex>;
}

export class HeatmapManager {
    private currentHeatmap?: Heatmap;
    private groups = new Map<string, Group>();
    private hexes: Hex[] = [];
    private hexesIdsToGroupIds = new Map<string, string>();
    private connections = new Set<Connection>();
    private rbxConnection = new Set<RBXScriptConnection>();

    private static instance: HeatmapManager;
    private constructor() {
        this.hexes = hexRepository.getAll();
    }

    public showHeatmap(heatmap: Heatmap) {
        if (this.currentHeatmap) {
            this.clear(); // teardown previous heatmap
        }

        this.currentHeatmap = heatmap;

        this.hexes.forEach((hex) => {
            this.updateHex(hex);
        }); // changed to forEach

        this.updateHighlights();
        heatmap.onEnable?.();

        if (typeOf(heatmap.onHeartbeat) === "function") {
            const hbConn = RunService.Heartbeat.Connect(() => heatmap.onHeartbeat!());
            this.rbxConnection.add(hbConn); // store Heartbeat connection
        }

        if (typeOf(heatmap.onRenderStepped) === "function") {
            const rsConn = RunService.RenderStepped.Connect(() => heatmap.onRenderStepped!());
            this.rbxConnection.add(rsConn); // store RenderStepped connection
        }
    }

    public updateHex(hex: Hex) {
        if (!this.currentHeatmap) {
            error("No heatmap is active!");
        }

        const groupInfo = this.currentHeatmap.getGroup(hex);
        const groupKey = groupInfo.name;

        if (!this.groups.has(groupKey)) {
            this.createGroup(groupInfo);
        }

        this.assignToGroup(hex, groupKey);
    }

    public updateHighlights() {
        this.groups.forEach((group) => {
            if (group.info.isHighlighted) {
                group.info.highlight!.Parent = undefined;
                group.info.highlight!.Parent = group.info.container;
            }
        });
    }

    private assignToGroup(hex: Hex, groupKey: string) {
        const group = this.groups.get(groupKey)!.info;
        const model = hex.getModel();

        model.Parent = group.container;
        const map = this.groups.get(groupKey)!.map;
        map.set(hex.getId(), hex);
        this.hexesIdsToGroupIds.set(hex.getId(), groupKey);
    }

    private createGroup(groupInfo: HeatmapGroup) {
        const container = new Instance("Model");
        container.Name = groupInfo.name;
        container.Parent = heatmapContainer;
        groupInfo.container = container;

        if (groupInfo.isHighlighted) {
            const highlight = new Instance("Highlight") as Highlight;
            highlight.Parent = container;
            highlight.Adornee = container;
            highlight.OutlineColor = groupInfo.outlineColor;
            highlight.OutlineTransparency = groupInfo.outlineTransparency;
            highlight.FillColor = groupInfo.fillColor;
            highlight.FillTransparency = groupInfo.fillTransparency;
            highlight.DepthMode = groupInfo.depthMode;
            groupInfo.highlight = highlight;
        }

        this.groups.set(groupInfo.name, { info: groupInfo, map: new Map() });
    }

    private clear() {
        // disconnect stored connections
        this.connections.forEach((conn) => {
            conn.disconnect();
        });
        this.rbxConnection.forEach((conn) => {
            conn.Disconnect();
        });
        this.connections.clear();

        // move hex models back and destroy highlights/containers
        this.groups.forEach(({ info, map }) => {
            map.forEach((hex) => {
                hex.getModel().Parent = Workspace;
            }); // changed to forEach
            if (info.isHighlighted) {
                info.highlight?.Destroy();
            }
            if (info.container) {
                info.container.Destroy();
            }
        }); // changed to forEach

        this.groups.clear();
        this.hexesIdsToGroupIds.clear();
        this.currentHeatmap = undefined;
    }

    public static resetInstance() {
        if (!this.instance) return;
        this.instance.clear(); // cleanup before resetting
        this.instance = new HeatmapManager();
    }

    public static getInstance(): HeatmapManager {
        if (!this.instance) {
            this.instance = new HeatmapManager();
        }
        return this.instance;
    }
}
