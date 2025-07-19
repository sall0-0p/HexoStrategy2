import {BuildingDef} from "../../../shared/classes/BuildingDef";
import {Signal} from "../../../shared/classes/Signal";
import {Hex} from "../hex/Hex";
import {Region} from "../region/Region";
import {Building} from "../../../shared/data/ts/BuildingDefs";

export class BuildingProject {
    public readonly id: string;
    public readonly def: BuildingDef;
    public readonly finished = new Signal<[]>();
    public readonly cancelled = new Signal<[]>();
    private progress = 0;

    constructor(
        id: string,
        def: BuildingDef,
        public readonly target: Hex | Region,
        private readonly removeFromQueue: (id: string) => void
    ) {
        this.id  = id;
        this.def = def;
    }

    public advance(units: number, ratePerFactory: number, onComplete: () => void) {
        const gain = units * ratePerFactory;
        this.progress += gain;

        if (this.progress >= this.def.buildCost) {
            this.target.getBuildings().addBuilding(this.def.id as Building, 1);
            this.finished.fire();
            onComplete();
        }
    }

    public cancel() {
        this.cancelled.fire();
        this.removeFromQueue(this.id);
    }

    public getProgress(){
        return this.progress;
    }
}