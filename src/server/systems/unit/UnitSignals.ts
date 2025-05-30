import {Unit} from "./Unit";
import {UnitDTO} from "../../../shared/dto/UnitDTO";
import {Signal} from "../../../shared/classes/Signal";

export interface DirtyUnitEvent {
    unit: Unit;
    delta: Partial<UnitDTO>;
}

export const dirtyUnitSignal = new Signal<[DirtyUnitEvent]>();