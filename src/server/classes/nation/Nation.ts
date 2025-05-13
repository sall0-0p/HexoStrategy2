import {NationDTO} from "../../../shared/dto/NationDTO";

export class Nation {
    private id;
    private name;
    private color: Color3;
    private player?: Player;

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
        // TODO: Add Networking update;
    }

    public getPlayer() {
        return this.player;
    }

    public setPlayer(player: Player) {
        this.player = player;
        // TODO: Add Networking update;
    }
}

export interface JsonNation {
    name: string,
    color: number[],
}