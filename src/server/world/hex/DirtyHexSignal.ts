import {Hex} from "./Hex";
import {HexDTO} from "../../../shared/network/hex/DTO";
import {Signal} from "../../../shared/classes/Signal";

export interface DirtyHexEvent {
    hex: Hex;
    delta: Partial<HexDTO>;
}

export const dirtyHexSignal = new Signal<[DirtyHexEvent]>();