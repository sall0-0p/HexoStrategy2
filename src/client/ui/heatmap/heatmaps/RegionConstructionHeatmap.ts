import {Heatmap, HeatmapGroup} from "../Heatmap";
import {Hex} from "../../../world/hex/Hex";
import {HexDispatcher, Update} from "../../../world/hex/HexDispatcher";
import {Connection} from "../../../../shared/classes/Signal";
import {HeatmapManager} from "../HeatmapManager";
import {Building, BuildingDefs} from "../../../../shared/data/ts/BuildingDefs";
import {BuildingType} from "../../../../shared/classes/BuildingDef";
import {RegionRepository} from "../../../world/region/RegionRepository";

export class RegionConstructionHeatmap implements Heatmap {
    private name = "Construction";
    private updateConnections: Connection[] = [];

    public constructor(private building: Building) {
        const def = BuildingDefs[this.building];
        if (def.type === BuildingType.Hex) error("Wrong heatmap for this type of Building!");
    }

    public getGroup(hex: Hex) {
        const region = hex.getRegion();
        const owner = region?.getOwner();

        if (region && owner?.getId() === _G.activeNationId) {
            const slots = region.getBuildings().slots.get(this.building) ?? 0;
            const buildings = region.getBuildings().buildings.get(this.building) ?? 0;
            const free = math.max(0, slots - buildings);
            const freeRatio = slots > 0 ? free / slots : 0;

            print(`${buildings}/${slots}`, free, freeRatio, region.getName());

            if (free > 0) {
                const fillColor    = Color3.fromHSV(0.27, 1, 0.4 + 0.6 * freeRatio);
                const outlineColor = Color3.fromHSV(0.27, 1, 0.2 + 0.4 * freeRatio);
                print(fillColor, outlineColor);

                return {
                    name: `SlotsAvailable_${free}`,
                    isHighlighted: true,
                    outlineColor,
                    outlineTransparency: 0.2,
                    fillColor,
                    fillTransparency: 0.25,
                    depthMode: Enum.HighlightDepthMode.Occluded,
                }
            } else {
                return {
                    name: "SlotsFull",
                    isHighlighted: true,
                    outlineColor: Color3.fromRGB(25, 57, 145),
                    outlineTransparency: 0.2,
                    fillColor: Color3.fromRGB(44, 97, 242),
                    fillTransparency: 0.4,
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

    public getName() {
        return this.name;
    }

    public onEnable() {
        const heatmapManager = HeatmapManager.getInstance();

        const regions = RegionRepository.getInstance().getAll();
        regions.forEach((r) => {
            const connection = r.changed.connect((prop) => {
                if (prop === "owner" || prop === "buildings") {
                    r.getHexes().forEach((h) => heatmapManager.updateHex(h));
                }
            })

            this.updateConnections.push(connection);
        })
    }

    public onDisable() {
        this.updateConnections.forEach((c) => c.disconnect());
    }
}