import {Signal} from "../../../shared/classes/Signal";
import {UnitDTO} from "../../../shared/dto/UnitDTO";
import {Nation} from "../nation/Nation";
import {Hex} from "../hex/Hex";
import {NationRepository} from "../nation/NationRepository";
import {HexRepository} from "../hex/HexRepository";

const nationRepository = NationRepository.getInstance();
const hexRepository = HexRepository.getInstance();
export class Unit {
    private id: number;
    private name: string;
    private template;
    private hp: number;
    private organisation: number;
    private owner: Nation;
    private position: Hex;

    private changedSignal?: Signal<[string, unknown]>;

    constructor(data: UnitDTO) {
        this.id = data.id;
        this.name = data.name;
        this.template = data.templateId; // TODO: Convert into template;
        this.hp = data.hp;
        this.organisation = data.organisation;

        if (nationRepository.getById(data.ownerId) === undefined) {
            error(`Nation ${data.ownerId} is not found, perhaps archives are incomplete.`)
        }
        this.owner = nationRepository.getById(data.ownerId)!;

        if (hexRepository.getById(data.positionId) === undefined) {
            error(`Hex ${data.positionId} is not found, perhaps archives are incomplete.`)
        }
        this.position = hexRepository.getById(data.positionId)!;
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
    }

    public getTemplate() {
        return this.template;
    }

    public getHp() {
        return this.hp;
    }

    public setHp(hp: number) {
        this.hp = hp;
    }

    public getOrganisation() {
        return this.organisation;
    }

    public setOrganisation(organisation: number) {
        this.organisation = organisation
    }

    public getOwner() {
        return this.owner;
    }

    public setOwner(owner: Nation) {
        this.owner = owner
    }

    public getPosition() {
        return this.position;
    }

    public setPosition(position: Hex) {
        this.position = position
    }

    public getChangedSignal() {
        if (!this.changedSignal) {
            this.changedSignal = new Signal();
        }

        return this.changedSignal;
    }
}