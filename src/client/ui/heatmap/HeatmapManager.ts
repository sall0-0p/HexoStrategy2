import {Heatmap, HeatmapGroup} from "./Heatmap";
import {Hex} from "../../world/hex/Hex";
import {HexRepository} from "../../world/hex/HexRepository";
import {Connection} from "../../../shared/classes/Signal";
import {RunService, Workspace} from "@rbxts/services";

const hexRepository = HexRepository.getInstance();
const heatmapContainer = Workspace.WaitForChild("Heatmaps") as Folder;

interface Group {
    info: HeatmapGroup,
    map: Map<string, Hex>,
}

export class HeatmapManager {
    private currentHeatmap?: Heatmap;
    private groups = new Map<string, Group>();
    private hexes: Hex[] = [];
    private hexesIdsToGroupIds = new Map<string, string>;
    private connections = new Set<Connection | RBXScriptConnection>;

    private static instance: HeatmapManager;
    private constructor() {
        this.hexes = hexRepository.getAll();
    }

    public showHeatmap(heatmap: Heatmap) {
        if (this.currentHeatmap) {
            // remove previous heatmap
        }

        this.currentHeatmap = heatmap;
        this.hexes.forEach((hex) => {
            this.updateHex(hex);
        })

        this.updateHighlights();

        heatmap.onEnable?.()

        if (typeOf(heatmap.onHeartbeat) === "function") {
            const connection = RunService.Heartbeat.Connect(() => heatmap.onHeartbeat!());
            this.connections.add(connection);
        }

        if (typeOf(heatmap.onRenderStepped) === "function") {
            const connection = RunService.Heartbeat.Connect(() => heatmap.onRenderStepped!());
            this.connections.add(connection);
        }
    }

    public updateHex(hex: Hex) {
        if (!this.currentHeatmap) {
            error("No heatmap is active!");
        }

        const group = this.currentHeatmap.getGroup(hex);
        const key = group.name;

        if (!this.groups.has(key)) {
            this.createGroup(group);
        }

        this.assignToGroup(hex, key);
    }

    public updateHighlights() {
        this.groups.forEach((group) => {
            if (group.info.isHighlighted) {
                group.info.highlight!.Parent = undefined;
                group.info.highlight!.Parent = group.info.container;
            }
        })
    }

    private assignToGroup(hex: Hex, groupId: string) {
        const group = this.groups.get(groupId)!.info;
        hex.getModel().Parent = group.container;

        const map = this.groups.get(groupId)!.map;
        map.set(hex.getId(), hex);

        this.hexesIdsToGroupIds.set(hex.getId(), groupId);
    }

    private createGroup(group: HeatmapGroup) {
        const container = new Instance("Model");
        container.Name = group.name;
        container.Parent = heatmapContainer;
        group.container = container;

        if (group.isHighlighted) {
            const highlight = new Instance("Highlight") as Highlight;
            highlight.Parent = container;
            highlight.Adornee = container;
            highlight.OutlineColor = group.outlineColor;
            highlight.OutlineTransparency = group.outlineTransparency;
            highlight.FillColor = group.fillColor;
            highlight.FillTransparency = group.fillTransparency;
            highlight.DepthMode = group.depthMode;
            group.highlight = highlight;
        }

        this.groups.set(group.name, { info: group, map: new Map() });
    }

    // singleton shenanigans
    public static getInstance(): HeatmapManager {
        if (!this.instance) {
            this.instance = new HeatmapManager();
        }

        return this.instance;
    }
}