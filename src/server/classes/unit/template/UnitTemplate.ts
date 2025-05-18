import {Nation} from "../../nation/Nation";
import {TemplateRepository} from "./TemplateRepository";

const templateRepository = TemplateRepository.getInstance();
export class UnitTemplate {
    private id: number;
    private name: string;
    private hp: number;
    private organisation: number;
    private speed: number;
    private damage: number;
    private model: Model;
    private icon: string;
    private owner: Nation;

    constructor(name: string, hp: number, organisation: number, speed: number, damage: number, model: Model, icon: string, owner: Nation) {
        this.id = TemplateCounter.getNextId();
        this.name = name;
        this.hp = hp;
        this.organisation = organisation;
        this.speed = speed;
        this.damage = damage;
        this.model = model;
        this.icon = icon;
        this.owner = owner;

        templateRepository.addTemplate(this);
    }

    public getId() {
        return this.id;
    }

    public getName() {
        return this.name;
    }

    public getHp() {
        return this.hp;
    }

    public getOrganisation() {
        return this.organisation;
    }

    public getSpeed() {
        return this.speed;
    }

    public getDamage() {
        return this.damage;
    }

    public getModel() {
        return this.model;
    }

    public getIcon() {
        return this.icon;
    }

    public getOwner() {
        return this.owner;
    }
}

export class TemplateCounter {
    private static currentId = 0

    public static getNextId() {
        this.currentId++
        return this.currentId;
    }
}