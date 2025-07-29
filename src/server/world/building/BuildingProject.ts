import {BuildingDef} from "../../../shared/classes/BuildingDef";
import {Signal} from "../../../shared/classes/Signal";
import {Hex} from "../hex/Hex";
import {Region} from "../region/Region";
import {Building, BuildingDefs} from "../../../shared/data/ts/BuildingDefs";
import {ConstructionController} from "./ConstructionController";

export class BuildingProject {
    public readonly id: string;
    public readonly type: Building;
    public readonly definition: BuildingDef;
    public readonly finished = new Signal<[]>();
    public readonly cancelled = new Signal<[]>();
    private factories: number = -1;
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
        if (units === 0 && this.factories === 0) {
            ConstructionController.getInstance().pushUpdate(this.target.getOwner()!, {
                constructionId: this.id,
                progress: this.progress,
                prediction: 0,
                factories: 0,
            });

            return;
        }

        const gain = (units * ratePerFactory) / 24;
        this.factories = units;
        this.progress += gain;

        // Send update!
        const prediction = (gain === 0) ? -1 : (this.definition.buildCost - this.progress) / gain;
        ConstructionController.getInstance().pushUpdate(this.target.getOwner()!, {
            constructionId: this.id,
            progress: this.progress,
            prediction: prediction,
            factories: units,
        });

        if (this.progress >= this.definition.buildCost) {
            this.target.getBuildings().addBuilding(this.definition.id as Building, 1);
            this.finished.fire();

            ConstructionController.getInstance().finishProject(this.target.getOwner()!, this.id);
            onComplete();
        }
    }

    public cancel() {
        this.cancelled.fire();
        this.removeFromQueue(this.id);
        ConstructionController.getInstance().finishProject(this.target.getOwner()!, this.id);
    }

    public getProgress(){
        return this.progress;
    }

    public getFactories() {
        return this.factories;
    }
}