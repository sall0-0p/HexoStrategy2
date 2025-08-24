import {WorldTooltip} from "./WorldTooltip";
import {TooltipService} from "../TooltipService";
import {TooltipEntry} from "../Tooltip";
import {Building, BuildingDefs} from "../../../../../shared/data/ts/BuildingDefs";
import {TextComponent} from "../components/TextComponent";
import {RTColor} from "../../../../../shared/constants/RichText";
import {Hex} from "../../../../world/hex/Hex";
import {RegionBuildings} from "../../../../world/region/Region";
import {BuildingType} from "../../../../../shared/types/BuildingDef";
import {EmptyComponent} from "../components/EmptyComponent";
import {SeparatorComponent} from "../components/SeparatorComponent";
import {TextUtils} from "../../../../../shared/functions/TextUtils";
import {RichTextComponent} from "../components/RichTextComponent";

export class SharedBuildTooltip implements WorldTooltip {
    constructor(private tooltipService: TooltipService, private building: Building) {

    }

    public get(): TooltipEntry<any>[] | undefined {
        return [
            { class: TextComponent, get: () => { return { text: this.getRegionText()}}},
            { class: RichTextComponent,
                get: () => this.getBuildingList(),
                if: () => this.shouldBuildingsBeVisible()
            },
            { class: EmptyComponent },
            { class: SeparatorComponent },
            { class: TextComponent, get: () => { return { text: `<font color="${RTColor.Green}">Click</font> to build <font color="${RTColor.Important}">${BuildingDefs[this.building].name}</font>` }}},
        ]
    }

    public isVisible() {
        return this.getHex()?.getRegion()?.getOwner().getId() === _G.activeNationId;
    }

    private getRegionText(): string {
        const hex = this.getHex();
        if (!hex) return `<font color="${RTColor.Important}">???</font> have used <font color="${RTColor.Important}">???</font> "slots" out of <font color="${RTColor.Important}">???</font>`;
        const buildings = hex.getRegion()!.getBuildings();
        const aggregated = this.getAggregates(buildings);
        const used = aggregated.built + aggregated.planned;
        return `<font color="${RTColor.Important}">${hex.getRegion()!.getName()}</font> have used <font color="${RTColor.Important}">${used}</font> ${TextUtils.pluralize(used, "slot", "slots", false)} out of <font color="${RTColor.Important}">${buildings.slots.get(this.building) ?? 0}</font>`;
    }

    private getBuildingList(): string {
        const hex = this.getHex();
        if (!hex) return `???`;

        let result = '';
        const buildings = hex.getRegion()!.getBuildings();
        const formatted = this.getFormattedBuildingTable(buildings);

        formatted.sort((a, b) => {
            return BuildingDefs[a.building].menuOrder > BuildingDefs[b.building].menuOrder;
        })

        formatted.forEach((row, i) => {
            const def = BuildingDefs[row.building];
            const color = def.iconColor3 ?? Color3.fromRGB(255, 255, 255);
            const iconColor = `rgb(${math.floor(color.R * 255)}, ${math.floor(color.G * 255)}, ${math.floor(color.B*255)})`;

            const br = i !== 0 ? `<br/>` : ``
            const planned = row.planned > 0 ? ` (<color value="${RTColor.Important}">+${row.planned}</color>)` : ``
            const rowStr = br + `<icon src="${def.icon}" color="${iconColor}"/> ${def.name}: <color value="${RTColor.Important}">${row.built}</color>` + planned;

            result = result + rowStr;
        })

        return result;
    }

    private shouldBuildingsBeVisible(): boolean {
        const hex = this.getHex();
        if (!hex) return false;

        const buildings = hex.getRegion()!.getBuildings();
        return this.getFormattedBuildingTable(buildings).size() > 0;
    }

    private getAggregates(buildings: RegionBuildings): { built: number, planned: number } {
        let built = 0;
        let planned = 0;

        buildings.built.forEach((count, building) => {
            if (BuildingDefs[building].type === BuildingType.Shared) {
                built += count;
            }
        })

        buildings.planned.forEach((count, building) => {
            if (BuildingDefs[building].type === BuildingType.Shared) {
                planned += count;
            }
        })

        return { built, planned };
    }

    private getHex() {
        const hex = this.tooltipService.getHexAtMousePosition();
        if (!hex) return;

        const region = hex.getRegion();
        if (!region) return undefined;

        return hex;
    }

    private getFormattedBuildingTable(rb: RegionBuildings): FormattedBuildingRow[] {
        const rows = new Map<Building, FormattedBuildingRow>();

        rb.built.forEach((count, building) => {
            if (BuildingDefs[building].type !== BuildingType.Shared) return;
            rows.set(building, {
                building,
                built: count,
                planned: 0,
            });
        })

        rb.planned.forEach((count, building) => {
            if (BuildingDefs[building].type !== BuildingType.Shared) return;
            const existing = rows.get(building);
            if (existing) {
                existing.planned = count;
            } else {
                rows.set(building, {
                    building,
                    built: 0,
                    planned: count,
                });
            }
        });

        const result: FormattedBuildingRow[] = [];
        rows.forEach((row) => result.push(row));
        return result;
    }
}

interface FormattedBuildingRow {
    building: Building;
    built: number;
    planned: number;
}