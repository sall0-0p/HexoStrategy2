import {BuildingDef} from "../../../shared/types/BuildingDef";
import {Signal} from "../../../shared/classes/Signal";
import {Hex} from "../../world/hex/Hex";
import {Region} from "../../world/region/Region";
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
    private lockedCost?: number;

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

    public advance(units: number, ratePerFactory: number, effectiveCostPreview: number, onComplete: () => void) {
        if (units > 0 && this.lockedCost === undefined) {
            this.lockedCost = effectiveCostPreview;
        }
        const cost = this.lockedCost ?? effectiveCostPreview;

        if (units === 0 && this.factories === 0) {
            ConstructionController.getInstance().pushUpdate(this.target.getOwner()!, {
                constructionId: this.id,
                progress: this.progress,
                prediction: 0,
                factories: 0,
                effectiveCost: cost,
            });
            return;
        }

        const gain = (units * ratePerFactory) / 24;
        this.factories = units;
        this.progress += gain;

        const remaining = math.max(0, cost - this.progress);
        const prediction = (gain === 0) ? -1 : (remaining / gain);

        ConstructionController.getInstance().pushUpdate(this.target.getOwner()!, {
            constructionId: this.id,
            progress: this.progress,
            prediction,
            factories: units,
            effectiveCost: cost,
        });

        if (this.progress >= cost) {
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