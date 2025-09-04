import {NationDTO} from "../../../shared/network/nation/DTO";
import {DirtyNationEvent, dirtyNationSignal} from "./DirtyNationSignal";
import {Signal} from "../../../shared/classes/Signal";
import {
    DiplomaticRelation,
    DiplomaticRelations,
    DiplomaticRelationStatus
} from "../../systems/diplomacy/DiplomaticRelation";
import {ModifierContainer} from "../../systems/modifier/ModifierContainer";
import {NationBuildingComponent} from "../../systems/construction/BuildingComponent";
import {ConstructionManager} from "../../systems/construction/ConstructionManager";
import {NationRepository} from "./NationRepository";
import {ModifierParent} from "../../../shared/types/Modifier";
import {FactoryProvider} from "../../systems/construction/FactoryProvider";
import {NationResourceComponent} from "../../systems/resource/NationResourceComponent";
import {EquipmentStockpile} from "../../systems/equipment/EquipmentStockpile";
import {NationEquipmentComponent} from "../../systems/equipment/NationEquipmentComponent";

export class Nation {
    private id;
    private name;
    private color: Color3;
    private flag: string;
    private player?: Player;
    private relations: DiplomaticRelations;
    private modifiers: ModifierContainer;
    private buildings = new NationBuildingComponent(this);
    private construction = new ConstructionManager(this);
    private factories = new FactoryProvider(this);
    private equipment = new NationEquipmentComponent(this);
    private resources = new NationResourceComponent(this, () => {
        dirtyNationSignal.fire({
            nation: this,
            delta: {
                resources: this.resources.toDTO(true),
            }
        } as DirtyNationEvent);
    });

    private changed: Signal<[string, unknown]> = new Signal();

    constructor(id: string, data: JsonNation) {
        this.id = id;
        this.name = data.name;
        this.color = Color3.fromRGB(data.color[0], data.color[1], data.color[2]);
        this.flag = data.flag;
        this.relations = new DiplomaticRelations(this);
        this.modifiers = new ModifierContainer(this.id, ModifierParent.Nation);

        this.buildings.updated.connect(() => {
            dirtyNationSignal.fire({
                nation: this,
                delta: {
                    building: this.buildings.toDTO(),
                }
            });
        })
    }

    public toDTO(): NationDTO {
        const allies: string[] = [];
        const enemies: string[] = [];

        this.relations.getRelations().forEach((relation, nation) => {
            if (relation.status === DiplomaticRelationStatus.Enemy) {
                enemies.push(nation.getId());
                return;
            }

            if (relation.status === DiplomaticRelationStatus.Allied) {
                allies.push(nation.getId());
                return;
            }
        })

        return {
            id: this.id,
            name: this.name,
            color: this.color,
            flag: this.flag,
            player: this.player,
            allies: allies,
            enemies: enemies,
            building: this.buildings.toDTO(),
            resources: this.resources.toDTO(),
        }
    }

    // getters & setters

    public getId() {
        return this.id;
    }

    public getName() {
        return this.name;
    }

    public getColor() {
        return this.color;
    }

    public setColor(color: Color3) {
        this.color = color;

        dirtyNationSignal.fire({
            nation: this,
            delta: {
                color: this.color,
            }
        } as DirtyNationEvent);

        this.changed?.fire("color", color);
    }

    public getFlag() {
        return this.flag
    }

    public setFlag(flag: string) {
        this.flag = flag;

        dirtyNationSignal.fire({
            nation: this,
            delta: {
                flag: flag,
            }
        } as DirtyNationEvent);

        this.changed?.fire("flag", flag);
    }

    public getPlayer() {
        return this.player;
    }

    public setPlayer(player: Player | undefined) {
        this.player = player;

        dirtyNationSignal.fire({
            nation: this,
            delta: {
                player: player,
            }
        } as DirtyNationEvent)

        this.changed?.fire("player", player);
    }

    public getRelations() {
        return this.relations;
    }

    public pushRelations() {
        const allies: string[] = [];
        const enemies: string[] = [];
        this.relations.getRelations().forEach((relation, nation) => {
            if (relation.status === DiplomaticRelationStatus.Enemy) {
                enemies.push(nation.getId());
            } else if (relation.status === DiplomaticRelationStatus.Allied) {
                allies.push(nation.getId());
            }
        })

        dirtyNationSignal.fire({
            nation: this,
            delta: {
                allies: allies,
                enemies: enemies,
            }
        } as DirtyNationEvent)
    }

    public getModifiers() {
        return this.modifiers;
    }

    public getBuildings() {
        return this.buildings;
    }

    public getFactories() {
        return this.factories;
    }

    public getResources() {
        return this.resources;
    }

    public getEquipment() {
        return this.equipment;
    }

    public getConstructionManager() {
        return this.construction;
    }
}

export interface JsonNation {
    name: string,
    color: number[],
    flag: string,
}