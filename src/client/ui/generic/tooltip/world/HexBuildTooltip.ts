import {Hex} from "../../../../world/hex/Hex";
import {WorldTooltip} from "./WorldTooltip";
import {TooltipService} from "../TooltipService";
import {TooltipEntry} from "../Tooltip";
import {Building, BuildingDefs} from "../../../../../shared/data/ts/BuildingDefs";
import {TextComponent} from "../components/TextComponent";
import {RTColor} from "../../../../../shared/config/RichText";

export class HexBuildTooltip implements WorldTooltip {
    constructor(private tooltipService: TooltipService, private building: Building) {

    }

    public get(): TooltipEntry<any>[] | undefined {
        return [
            { class: TextComponent, get: () => { return { text: `<font color="${RTColor.Green}">Click</font> to build <font color="${RTColor.Important}">${BuildingDefs[this.building].name}</font>` } }}
        ]
    }
}