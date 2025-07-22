import {BuildingDef} from "../../../shared/classes/BuildingDef";
import {Signal} from "../../../shared/classes/Signal";
import {Hex} from "../hex/Hex";
import {Region} from "../region/Region";
import {Building, BuildingDefs} from "../../../shared/data/ts/BuildingDefs";

export class BuildingProject {
    public readonly id: string;
    public readonly type: Building;
    public readonly definition: BuildingDef;
    public readonly finished = new Signal<[]>();
    public readonly cancelled = new Signal<[]>();
    private factories: number = 0;
    private progress = 0;

    constructor(
        id: string,
        buildingType: Building,
        public readonly target: Hex | Region,
        private readonly removeFromQueue: (id: string) => void
    ) {
        this.id  = id;
        this.type = buildingType;
        this.definition = BuildingDefs[this.type];
    }

    public advance(units: number, ratePerFactory: number, onComplete: () => void) {
        const gain = units * ratePerFactory;
        this.factories = units;
        this.progress += gain;

        print(units, ratePerFactory, gain, this.progress);
        if (this.progress >= this.definition.buildCost) {
            this.target.getBuildings().addBuilding(this.definition.id as Building, 1);
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

    public getFactories() {
        return this.factories;
    }
}