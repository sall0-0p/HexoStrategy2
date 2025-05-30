import {Signal} from "../../../shared/classes/Signal";
import {Nation} from "./Nation";
import {NationDTO} from "../../../shared/dto/NationDTO";

export interface DirtyNationEvent {
    nation: Nation;
    delta: Partial<NationDTO>;
}

export const dirtyNationSignal = new Signal<[DirtyNationEvent]>();