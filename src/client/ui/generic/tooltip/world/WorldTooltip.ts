import {TooltipService} from "../TooltipService";
import {TooltipEntry} from "../Tooltip";

export interface WorldTooltip {
    get(): TooltipEntry<any>[] | undefined;
    isVisible?(): boolean;
}