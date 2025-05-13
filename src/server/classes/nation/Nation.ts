import {NationDTO} from "../../../shared/dto/NationDTO";
import {DirtyNationEvent, dirtyNationSignal} from "./DirtyNationSignal";
import {Signal} from "../../../shared/classes/Signal";

export class Nation {
    private id;
    private name;
    private color: Color3;
    private player?: Player;

    private changedSignal?: Signal<[string, unknown]>;

    constructor(id: string, data: JsonNation) {
        this.id = id;
        this.name = data.name;
        this.color = new Color3(data.color[0], data.color[1], data.color[2]);
    }

    public toDTO(): NationDTO {
        return {
            id: this.id,
            name: this.name,
            color: [this.color.R * 255, this.color.G * 255, this.color.B * 255],
            player: this.player,
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
                color: [color.R * 255, color.B * 255, color.G * 255],
            }
        } as DirtyNationEvent)

        this.changedSignal?.fire("color", color);
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
}