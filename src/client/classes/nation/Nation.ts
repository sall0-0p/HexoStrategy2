import {NationDTO} from "../../../shared/dto/NationDTO";
import {Signal} from "../../../shared/classes/Signal";

export class Nation {
    private readonly id;
    private readonly name;
    private color: Color3;
    private player?: Player;

    private changedSignal?: Signal<[string, unknown]>;

    constructor(data: NationDTO) {
        this.id = data.id;
        this.name = data.name;
        this.color = data.color;
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

    public setColor(color: Color3) {
        this.color = color;

        this.changedSignal?.fire("color", color);
    }

    public getPlayer() {
       return this.player;
    }

    public setPlayer(player: Player) {
        this.player = player;

        this.changedSignal?.fire("player", player);
    }
}