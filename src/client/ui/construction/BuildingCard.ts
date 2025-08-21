import {Building, BuildingDefs} from "../../../shared/data/ts/BuildingDefs";
import {ConstructionWindow} from "./ConstructionWindow";
import {ReplicatedStorage, UserInputService} from "@rbxts/services";
import {BuildingDef, BuildingType} from "../../../shared/classes/BuildingDef";
import {TooltipService} from "../generic/tooltip/TooltipService";
import {UIStateMachine} from "../fsm/UIStateMachine";
import {RegionConstructionState} from "../fsm/states/RegionConstructionState";
import {HexConstructionState} from "../fsm/states/HexConstructionState";
import {EmptyComponent} from "../generic/tooltip/components/EmptyComponent";
import {RichTextComponent} from "../generic/tooltip/components/RichTextComponent";
import {HeaderComponent} from "../generic/tooltip/components/HeaderComponent";
import {RTColor, RTIcon} from "../../../shared/config/RichText";
import {UIStateType} from "../fsm/UIState";

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
    private readonly rbxConnections: RBXScriptConnection[] = [];
    private currentlySelected = false;

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

        this.frame.Destroying.Connect(() => this.destroy());

        this.load();
        this.frame.Parent = this.container;
    }

    private load() {
        // Image label - icon of building;
        const image = this.frame.WaitForChild("Icon") as ImageLabel;
        image.Image = this.def.icon;
        image.ImageColor3 = this.def.iconColor3 ?? Color3.fromRGB(255, 255, 255);
        this.frame.LayoutOrder = this.def.menuOrder;

        this.ts.bind(this.frame, [
            { class: HeaderComponent, get: () => {
                return { text: this.def.name };
            }},
            { class: RichTextComponent, get: () => {
                return this.def.description;
            }},
            { class: EmptyComponent },
            { class: RichTextComponent, get: () => {
                const updateNotice = this.def.upgradeCost ? ` (<b><color value="${RTColor.Important}">${this.def.upgradeCost}</color></b> per additional level)` : ``
                return `Building cost: <icon src="${RTIcon.ProductionCost}"/> <b><color value="${RTColor.Important}">${this.def.buildCost}</color></b>` + updateNotice;
            }}
        ])

        this.bind();
    }

    private bind() {
        let connection: RBXScriptConnection
        if (this.def.type === BuildingType.Hex) {
            connection =
                this.frame.MouseButton1Click.Connect(() => {
                    UIStateMachine.getInstance().changeTo(new HexConstructionState(this.building));
                    this.currentlySelected = true;
                    this.frame.BackgroundColor3 = Color3.fromRGB(255, 255, 255);
                })
        } else {
            connection =
                this.frame.MouseButton1Click.Connect(() => {
                    UIStateMachine.getInstance().changeTo(new RegionConstructionState(this.building));
                    this.currentlySelected = true;
                    this.frame.BackgroundColor3 = Color3.fromRGB(255, 255, 255);
                })
        }

        this.rbxConnections.push(connection);

        this.rbxConnections.push(UserInputService.InputEnded.Connect((input) => {
            if (input.UserInputType === Enum.UserInputType.MouseButton1) {
                let shouldReset: boolean = false;
                const currentState = UIStateMachine.getInstance().getCurrentState();
                if (currentState?.type === UIStateType.RegionConstruction) {
                    const state = currentState as RegionConstructionState;
                    shouldReset = (state.building !== this.building);
                } else if (currentState?.type === UIStateType.HexConstruction) {
                    const state = currentState as HexConstructionState;
                    shouldReset = (state.building !== this.building);
                }

                if (shouldReset) {
                    this.frame.BackgroundColor3 = Color3.fromRGB(0, 0, 0);
                    this.currentlySelected = false;
                }
            }
        }));

        this.rbxConnections.push(this.frame.MouseEnter.Connect(() => {
            this.frame.BackgroundColor3 = Color3.fromRGB(205, 205, 205);
        }))

        this.rbxConnections.push(this.frame.MouseLeave.Connect(() => {
            if (!this.currentlySelected) {
                this.frame.BackgroundColor3 = Color3.fromRGB(0, 0, 0);
            } else {
                this.frame.BackgroundColor3 = Color3.fromRGB(255, 255, 255);
            }
        }))
    }

    public destroy() {
        this.rbxConnections.forEach((c) => c.Disconnect());
    }
}