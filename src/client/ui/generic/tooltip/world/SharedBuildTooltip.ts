import {WorldTooltip} from "./WorldTooltip";
import {TooltipService} from "../TooltipService";
import {TooltipEntry} from "../Tooltip";
import {Building, BuildingDefs} from "../../../../../shared/data/ts/BuildingDefs";
import {TextComponent} from "../components/TextComponent";
import {RTColor} from "../../../../../shared/config/RichText";
import {Hex} from "../../../../world/hex/Hex";
import {RegionBuildings} from "../../../../world/region/Region";
import {BuildingType} from "../../../../../shared/classes/BuildingDef";
import {EmptyComponent} from "../components/EmptyComponent";
import {SeparatorComponent} from "../components/SeparatorComponent";
import {TextUtils} from "../../../../../shared/classes/TextUtils";

export class SharedBuildTooltip implements WorldTooltip {
    constructor(private tooltipService: TooltipService, private building: Building) {

    }

    public get(): TooltipEntry<any>[] | undefined {
        return [
            { class: TextComponent, get: () => { return { text: this.getRegionText()}}},
            { class: EmptyComponent, if: () => {
                    return this.getHex()?.getRegion()?.getOwner().getId() === _G.activeNationId;
                }},
            { class: SeparatorComponent, if: () => {
                    return this.getHex()?.getRegion()?.getOwner().getId() === _G.activeNationId;
                }},
            { class: TextComponent, get: () => { return { text: `<font color="${RTColor.Green}">Click</font> to build <font color="${RTColor.Important}">${BuildingDefs[this.building].name}</font>` }},  if: () => {
                    return this.getHex()?.getRegion()?.getOwner().getId() === _G.activeNationId;
                }},
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
}