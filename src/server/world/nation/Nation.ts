import {NationDTO} from "../../../shared/dto/NationDTO";
import {DirtyNationEvent, dirtyNationSignal} from "./DirtyNationSignal";
import {Signal} from "../../../shared/classes/Signal";
import {DiplomaticRelation, DiplomaticRelationStatus} from "../../systems/diplomacy/DiplomaticRelation";

export class Nation {
    private id;
    private name;
    private color: Color3;
    private flag: string;
    private player?: Player;
    private relations: Map<string, DiplomaticRelation> = new Map();

    private changedSignal?: Signal<[string, unknown]>;

    constructor(id: string, data: JsonNation) {
        this.id = id;
        this.name = data.name;
        this.color = Color3.fromRGB(data.color[0], data.color[1], data.color[2]);
        this.flag = data.flag;
    }

    public toDTO(): NationDTO {
        const allies: string[] = [];
        const enemies: string[] = [];

        this.relations.forEach((relation, nationId) => {
            if (relation.status === DiplomaticRelationStatus.Enemy) {
                enemies.push(nationId);
                return;
            }

            if (relation.status === DiplomaticRelationStatus.Allied) {
                allies.push(nationId);
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

        this.changedSignal?.fire("color", color);
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

        this.changedSignal?.fire("flag", flag);
    }

    public getPlayer() {
        return this.player;
    }

    public setPlayer(player: Player) {
        this.player = player;

        dirtyNationSignal.fire({
            nation: this,
            delta: {
                player: player,
            }
        } as DirtyNationEvent)

        this.changedSignal?.fire("player", player);
    }

    public getRelations() {
        return this.relations;
    }

    public setRelations(relations: Map<string, DiplomaticRelation>) {
        this.relations = relations;

        dirtyNationSignal.fire({
            nation: this,
            delta: {
                // TODO: This can be optimised, by only sending delta of relations, not full relations.
                relations: this.relations,
            }
        } as DirtyNationEvent)
    }

    public getChangedSignal() {
        if (!this.changedSignal) {
            this.changedSignal = new Signal();
        }

        return this.changedSignal;
    }
}

export interface JsonNation {
    name: string,
    color: number[],
    flag: string,
}