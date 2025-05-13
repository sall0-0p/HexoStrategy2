import {NationDTO} from "../../../shared/dto/NationDTO";

export class Nation {
    private readonly id;
    private readonly name;
    private color: Color3;
    private player?: Player;

    constructor(data: NationDTO) {
        this.id = data.id;
        this.name = data.name;
        this.color = Color3.fromRGB(data.color[0], data.color[1], data.color[2]);
        this.player = data.player;
    }

    public getId() {
        return this.id;
    }

    public getName() {
        return this.name;
    }

    public getColor() {
        return this.color;
    }

    public getPlayer() {
       return this.player;
    }
}