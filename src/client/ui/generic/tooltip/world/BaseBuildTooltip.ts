import {WorldTooltip} from "./WorldTooltip";
import {TooltipService} from "../TooltipService";
import {TooltipEntry} from "../Tooltip";
import {Building, BuildingDefs} from "../../../../../shared/data/ts/BuildingDefs";
import {TextComponent} from "../components/TextComponent";
import {RTColor} from "../../../../../shared/constants/RichText";

export class BaseBuildTooltip implements WorldTooltip {
    constructor(private tooltipService: TooltipService, private building: Building) {

    }

    public get(): TooltipEntry<any>[] | undefined {
        const hex = this.tooltipService.getHexAtMousePosition();
        if (!hex) {
            this.tooltipService.hideWorld();
            return;
        }

        return [
            { class: TextComponent, get: () => { return { text: `<font color="${RTColor.Green}">Click</font> to build <font color="${RTColor.Important}">${BuildingDefs[this.building].name}</font>` } }}
        ]
    }

    public isVisible() {
        return this.tooltipService.getHexAtMousePosition()?.getRegion()?.getOwner().getId() === _G.activeNationId;
    }
}