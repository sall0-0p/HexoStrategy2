import {Signal} from "../../../shared/classes/Signal";
import {UnitDTO} from "../../../shared/dto/UnitDTO";
import {Nation} from "../../world/nation/Nation";
import {Hex} from "../../world/hex/Hex";
import {NationRepository} from "../../world/nation/NationRepository";
import {HexRepository} from "../../world/hex/HexRepository";
import {UnitFlairManager} from "../../ui/unit/flair/UnitFlairManager";

export class Unit {
    private id: string;
    private name: string;
    private template;
    private hp: number;
    private organisation: number;
    private owner: Nation;
    private position: Hex;

    private nationRepository = NationRepository.getInstance();
    private hexRepository = HexRepository.getInstance();
    private unitFlairManager = UnitFlairManager.getInstance();

    private changedSignal?: Signal<[string, unknown]>;

    constructor(data: UnitDTO) {
        this.id = data.id;
        this.name = data.name;
        this.template = data.templateId; // TODO: Convert into template;
        this.hp = data.hp;
        this.organisation = data.organisation;

        if (this.nationRepository.getById(data.ownerId) === undefined) {
            error(`Nation ${data.ownerId} is not found, perhaps archives are incomplete.`)
        }
        this.owner = this.nationRepository.getById(data.ownerId)!;

        if (this.hexRepository.getById(data.positionId) === undefined) {
            error(`Hex ${data.positionId} is not found, perhaps archives are incomplete.`)
        }
        this.position = this.hexRepository.getById(data.positionId)!;

        // Add flairs
        this.unitFlairManager.addUnitToTheMap(this);
    }

    public die() {
        this.delete();
    }

    public delete() {
        this.unitFlairManager.deleteUnitFromTheMap(this);
    }

    // getters & setters

    public getId() {
        return this.id;
    }

    public getName() {
        return this.name;
    }

    public setName(name: string) {
        this.name = name;
        this.changedSignal?.fire("name", name);
    }

    public getTemplate() {
        return this.template;
    }

    public getHp() {
        return this.hp;
    }

    public setHp(hp: number) {
        this.hp = hp;
        this.changedSignal?.fire("hp", hp);

        // unitFlairManager.updateUnitHp(this);
    }

    public getOrganisation() {
        return this.organisation;
    }

    public setOrganisation(organisation: number) {
        this.organisation = organisation
        this.changedSignal?.fire("organisation", organisation);

        // unitFlairManager.updateUnitOrganisation(this);
    }

    public getOwner() {
        return this.owner;
    }

    public setOwner(owner: Nation) {
        this.owner = owner
        this.changedSignal?.fire("owner", owner);

        // unitFlairManager.updateUnitOwner(this);
    }

    public getPosition() {
        return this.position;
    }

    public setPosition(position: Hex) {
        this.position = position
        this.changedSignal?.fire("position", position);
        // unitFlairManager.updateUnitPosition(this, oldPosition);
    }

    public getChangedSignal() {
        if (!this.changedSignal) {
            this.changedSignal = new Signal();
        }

        return this.changedSignal;
    }
}