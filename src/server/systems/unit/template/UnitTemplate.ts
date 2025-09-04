import {Nation} from "../../../world/nation/Nation";
import {TemplateRepository} from "./TemplateRepository";
import {UnitType} from "../../../../shared/constants/UnitType";
import {StatsTemplate} from "../../../../shared/types/StatsTemplate";
import {UnitTemplateDTO} from "../../../../shared/network/unit/template/DTO";
import {LandEquipmentArchetype} from "../../../../shared/constants/EquipmentArchetype";
import {Signal} from "../../../../shared/classes/Signal";

const templateRepository = TemplateRepository.getInstance();

export class UnitTemplate {
    // Base properties
    private id: string;
    private name: string;
    private model: Model;
    private icon: string;
    private owner: Nation;

    // Stats Properties
    private speed: number;
    private hp: number;
    private organisation: number;
    private recovery: number;
    private softAttack: number;
    private hardAttack: number;
    private defence: number;
    private breakthrough: number;
    private armor: number;
    private piercing: number;
    private initiative: number;
    private combatWidth: number;
    private hardness: number;
    private unitType: UnitType;

    private requiredEquipment: Map<LandEquipmentArchetype, number> = new Map();

    public readonly updated: Signal<[]> = new Signal();

    constructor(name: string, stats: StatsTemplate, model: Model, icon: string, owner: Nation, requiredEquipment: { [key in LandEquipmentArchetype]?: number } ) {
        this.id = TemplateCounter.getNextId();
        this.name = name;
        this.speed = stats.speed;
        this.hp = stats.hp;
        this.organisation = stats.organisation;
        this.recovery = stats.recovery;
        this.softAttack = stats.softAttack;
        this.hardAttack = stats.hardAttack;
        this.defence = stats.defence;
        this.breakthrough = stats.breakthrough;
        this.armor = stats.armor;
        this.piercing = stats.piercing;
        this.initiative = stats.initiative;
        this.combatWidth = stats.combatWidth;
        this.hardness = stats.hardness;
        this.unitType = stats.unitType;
        this.model = model;
        this.icon = icon;
        this.owner = owner;

        for (const [t, n] of pairs(requiredEquipment)) {
            this.requiredEquipment.set(t, n);
        }

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

    public getRecovery() {
        return this.recovery;
    }

    public getSpeed() {
        return this.speed;
    }

    public getSoftAttack() {
        return this.softAttack;
    }

    public getHardAttack() {
        return this.hardAttack;
    }

    public getDefence() {
        return this.defence;
    }

    public getBreakthrough() {
        return this.breakthrough;
    }

    public getArmor() {
        return this.armor;
    }

    public getPiercing() {
        return this.piercing;
    }

    public getInitiative() {
        return this.initiative;
    }

    public getCombatWidth() {
        return this.combatWidth;
    }

    public getHardness() {
        return this.hardness;
    }

    public getUnitType() {
        return this.unitType;
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

    public getEquipment() {
        return this.requiredEquipment;
    }

    public toUnitTemplateDTO(): UnitTemplateDTO {
        return {
            id: this.getId(),
            name: this.getName(),
            stats: {
                speed: this.getSpeed(),
                hp: this.getHp(),
                organisation: this.getOrganisation(),
                recovery: this.getRecovery(),
                softAttack: this.getSoftAttack(),
                hardAttack: this.getHardAttack(),
                defence: this.getDefence(),
                breakthrough: this.getBreakthrough(),
                armor: this.getArmor(),
                piercing: this.getPiercing(),
                initiative: this.getInitiative(),
                combatWidth: this.getCombatWidth(),
                hardness: this.getHardness(),
                unitType: this.getUnitType(),
            },
            modelName: this.getModel().Name,
            icon: this.getIcon(),
            ownerId: this.getOwner().getId(),
            ownerName: this.getOwner().getName(),
            unitType: this.getUnitType(),
        };
    }
}

export class TemplateCounter {
    private static currentId = 0

    public static getNextId() {
        this.currentId++
        return tostring(this.currentId);
    }
}