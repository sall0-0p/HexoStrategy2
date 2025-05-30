import {NationDTO} from "../../../shared/dto/NationDTO";
import {Signal} from "../../../shared/classes/Signal";

export class Nation {
    private readonly id;
    private readonly name;
    private color: Color3;
    private flag: string;
    private player?: Player;

    private changedSignal?: Signal<[string, unknown]>;

    constructor(data: NationDTO) {
        this.id = data.id;
        this.name = data.name;
        this.color = data.color;
        this.flag = data.flag;
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
        // TODO: Add update to all units flairs in this nation;
    }

    public getPlayer() {
       return this.player;
    }

    public setPlayer(player: Player) {
        this.player = player;
        this.changedSignal?.fire("player", player);
    }

    public getFlag() {
        return this.flag;
    }

    public setFlag(flag: string) {
        this.flag = flag;
        this.changedSignal?.fire("flag", flag);
        // TODO: Add update all unit flags of this nation;
    }
}