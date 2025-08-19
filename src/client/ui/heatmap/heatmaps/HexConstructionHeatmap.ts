import {Heatmap, HeatmapGroup} from "../Heatmap";
import {Hex} from "../../../world/hex/Hex";
import {HexDispatcher, Update} from "../../../world/hex/HexDispatcher";
import {Connection} from "../../../../shared/classes/Signal";
import {HeatmapManager} from "../HeatmapManager";
import {Building, BuildingDefs} from "../../../../shared/data/ts/BuildingDefs";
import {BuildingType} from "../../../../shared/classes/BuildingDef";
import {RegionRepository} from "../../../world/region/RegionRepository";
import {StripeManager, StripeStyle} from "../StripeManager";
import {HexRepository} from "../../../world/hex/HexRepository";

export class HexConstructionHeatmap implements Heatmap {
    private name = "Construction";
    private updateConnections: Connection[] = [];

    public constructor(private building: Building) {
        const def = BuildingDefs[this.building];
        if (def.type !== BuildingType.Hex) error("Wrong heatmap for this type of Building!");
    }

    public getGroup(hex: Hex): HeatmapGroup {
        const owner = hex.getOwner();

        if (owner && owner?.getId() === _G.activeNationId) {
            const slots = hex.getBuildings().slots.get(this.building) ?? 0;
            const buildings = hex.getBuildings().built.get(this.building) ?? 0;
            const free = math.max(0, slots - buildings);
            const occupiedRatio = slots > 0 ? math.min(1, buildings / slots) : 0;

            if (free > 0) {
                const minFillT = 0.2;
                const maxFillT = 0.5;
                const emptyFillT = 0.7;
                const minOutlineT = 0.20;
                const maxOutlineT = 0.55;

                const fillTransparency = occupiedRatio > 0 ? math.lerp(maxFillT, minFillT, occupiedRatio) : emptyFillT;
                const outlineTransparency = math.lerp(maxOutlineT, minOutlineT, occupiedRatio);

                return {
                    name: `SlotsAvailable_${free}`,
                    isHighlighted: true,
                    outlineColor: Color3.fromRGB(15, 250, 50),
                    outlineTransparency,
                    fillColor: Color3.fromRGB(15, 250, 50),
                    fillTransparency,
                    depthMode: Enum.HighlightDepthMode.Occluded,
                }
            } else {
                const minFillT = 0.25;
                const maxFillT = 0.45;
                const minOutlineT = 0.18;
                const maxOutlineT = 0.35;

                return {
                    name: "SlotsFull",
                    isHighlighted: true,
                    outlineColor: Color3.fromRGB(25, 57, 145),
                    outlineTransparency: math.lerp(maxOutlineT, minOutlineT, occupiedRatio),
                    fillColor: Color3.fromRGB(44, 97, 242),
                    fillTransparency: math.lerp(maxFillT, minFillT, occupiedRatio),
                    depthMode: Enum.HighlightDepthMode.Occluded,
                }
            }
        } else {
            return {
                name: "Unassigned",
                isHighlighted: true,
                outlineColor: Color3.fromRGB(255, 255, 255),
                outlineTransparency: 0.2,
                fillColor: Color3.fromRGB(255, 255, 255),
                fillTransparency: 0.4,
                depthMode: Enum.HighlightDepthMode.Occluded,
            } as HeatmapGroup
        }
    }

    public getStripes(hex: Hex): StripeStyle | undefined {
        const buildings = hex.getBuildings();
        if (!buildings) return;

        const planned = buildings.planned.get(this.building) ?? 0;
        const current = buildings.built.get(this.building) ?? 0;
        const slots = buildings.slots.get(this.building) ?? 0;
        if (planned > 0 && planned + current >= slots) {
            return {
                color: Color3.fromRGB(44, 97, 242),
            }
        }

        if (planned > 0) {
            return {
                color: Color3.fromRGB(241, 247, 42),
            }
        }

        return {
            transparency: 1,
        }
    }

    public getName() {
        return this.name;
    }

    public onEnable() {
        const heatmapManager = HeatmapManager.getInstance();

        const hexes = HexRepository.getInstance().getAll();
        hexes.forEach((h) => {
            const connection = h.changed.connect((prop) => {
                if (prop === "owner" || prop === "buildings") {
                    heatmapManager.updateHex(h);
                }
            })

            this.updateConnections.push(connection);
        })
    }

    public onDisable() {
        this.updateConnections.forEach((c) => c.disconnect());
    }
}