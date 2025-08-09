import {Building, BuildingDefs} from "../../../shared/data/ts/BuildingDefs";
import {ConstructionWindow} from "./ConstructionWindow";
import {ReplicatedStorage} from "@rbxts/services";
import {BuildingDef, BuildingType} from "../../../shared/classes/BuildingDef";
import {TooltipService} from "../generic/tooltip/TooltipService";
import {TextComponent} from "../generic/tooltip/components/TextComponent";
import {UIStateMachine} from "../fsm/UIStateMachine";
import {RegionConstructionState} from "../fsm/states/RegionConstructionState";

const template = ReplicatedStorage
    .WaitForChild("Assets")
    .WaitForChild("UI")
    .WaitForChild("Construction")
    .WaitForChild("BuildingCard") as TextButton;

export class BuildingCard {
    private readonly frame: TextButton;
    private readonly def: BuildingDef;
    private readonly container: Frame;
    private readonly ts = TooltipService.getInstance();

    constructor(private readonly building: Building, window: ConstructionWindow) {
        this.frame = template.Clone();
        this.def = BuildingDefs[building];

        const buildingType: BuildingType = this.def.type;
        const mainContainer = window.getFrame().WaitForChild("Body")
            .WaitForChild("Side")
            .WaitForChild("Container") as Frame;

        switch (buildingType) {
            case BuildingType.Region:
                this.container = mainContainer.WaitForChild("Region")
                    .WaitForChild("Container") as Frame;
                break;
            case BuildingType.Shared:
                this.container = mainContainer.WaitForChild("Shared")
                    .WaitForChild("Container") as Frame;
                break;
            case BuildingType.Hex:
                this.container = mainContainer.WaitForChild("Hex")
                    .WaitForChild("Container") as Frame;
                break;
        }

        this.load();
        this.frame.Parent = this.container;
    }

    private load() {
        // Image label - icon of building;
        const image = this.frame.WaitForChild("Icon") as ImageLabel;
        image.Image = this.def.icon;
        image.ImageColor3 = this.def.iconColor3 ?? Color3.fromRGB(255, 255, 255);

        this.ts.bind(this.frame, [
            { class: TextComponent, get: () => {
                return { text: this.def.name };
            }}
        ])

        this.bind();
    }

    private bind() {
        this.frame.MouseButton1Click.Connect(() => {
            UIStateMachine.getInstance().changeTo(new RegionConstructionState(this.building));
        })
    }
}