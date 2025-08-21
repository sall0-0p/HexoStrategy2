import {NationDTO} from "../../../shared/network/nation/DTO";
import {Signal} from "../../../shared/classes/Signal";
import {ModifierContainer} from "../../systems/modifier/ModifierContainer";
import {ModifierParent} from "../../../shared/classes/Modifier";

export class Nation {
    private readonly id;
    private readonly name;
    private color: Color3;
    private flag: string;
    private player?: Player;
    private allies: Nation[] = [];
    private enemies: Nation[] = [];
    private modifiers: ModifierContainer

    private changedSignal?: Signal<[string, unknown]>;

    constructor(data: NationDTO) {
        this.id = data.id;
        this.name = data.name;
        this.color = data.color;
        this.flag = data.flag;
        this.player = data.player;
        this.modifiers = new ModifierContainer(this.id, ModifierParent.Nation);
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

    public setPlayer(player: Player | undefined) {
        this.player = player;
        this.changedSignal?.fire("player", player);
    }

    public getFlag() {
        return this.flag;
    }

    public setFlag(flag: string) {
        this.flag = flag;
        this.changedSignal?.fire("flag", flag);
    }

    public getAllies() {
        return this.allies
    }

    public setAllies(allies: Nation[]) {
        this.allies = allies;
        this.changedSignal?.fire("allies", allies);
    }

    public getEnemies() {
        return this.enemies
    }

    public setEnemies(enemies: Nation[]) {
        this.enemies = enemies;
        this.changedSignal?.fire("enemies", enemies);
    }

    public getModifiers() {
        return this.modifiers;
    }

    public getChangedSignal() {
        if (!this.changedSignal) {
            this.changedSignal = new Signal();
        }

        return this.changedSignal;
    }
}