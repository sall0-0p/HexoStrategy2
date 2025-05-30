import {Hex} from "../../world/hex/Hex";

export interface Heatmap {
    getName(): string,
    getGroup(hex: Hex): HeatmapGroup,
    onEnable?(): void,
    onDisable?(): void,
    onRenderStepped?(): void,
    onHeartbeat?(): void,
}

interface BaseHeatmapGroup {
    name: string,
    isHighlighted: boolean,
    container?: Model;
}

interface NormalHeatmapGroup extends BaseHeatmapGroup {
    isHighlighted: false;
}

interface HighlightedHeatmapGroup extends BaseHeatmapGroup {
    isHighlighted: true;

    outlineColor: Color3;
    outlineTransparency: number;
    fillColor: Color3;
    fillTransparency: number;
    depthMode: Enum.HighlightDepthMode.Occluded | Enum.HighlightDepthMode.AlwaysOnTop,

    highlight?: Highlight;
}

export type HeatmapGroup = NormalHeatmapGroup | HighlightedHeatmapGroup;