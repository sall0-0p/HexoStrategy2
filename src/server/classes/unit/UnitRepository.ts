import {Unit} from "./Unit";
import {Nation} from "../nation/Nation";
import {Hex} from "../hex/Hex";

export class UnitRepository {
    private unitsById= new Map<string, Unit>;
    private unitsByOwner = new Map<Nation, Set<Unit>>; // Needs to be updated
    private unitsByHex = new Map<Hex, Set<Unit>>; // Needs to be updated

    private static instance: UnitRepository;
    private constructor() {

    }

    public addUnit(unit: Unit) {
        this.unitsById.set(unit.getId(), unit);

        if (!this.unitsByOwner.has(unit.getOwner())) {
            this.unitsByOwner.set(unit.getOwner(), new Set<Unit>);
        }
        this.unitsByOwner.get(unit.getOwner())!.add(unit);

        if (!this.unitsByHex.has(unit.getPosition())) {
            this.unitsByHex.set(unit.getPosition(), new Set<Unit>);
        }
        this.unitsByHex.get(unit.getPosition())!.add(unit);
    }

    public updateUnit(unit: Unit, key: string, oldValue: unknown, value: unknown) {
        if (key === "owner") {
            this.unitsByOwner.get(oldValue as Nation)?.delete(unit);

            if (!this.unitsByOwner.has(unit.getOwner())) {
                this.unitsByOwner.set(unit.getOwner(), new Set<Unit>);
            }
            this.unitsByOwner.get(unit.getOwner())!.add(unit);
        } else if (key === "position") {
            this.unitsByHex.get(oldValue as Hex)?.delete(unit);

            if (!this.unitsByHex.has(unit.getPosition())) {
                this.unitsByHex.set(unit.getPosition(), new Set<Unit>);
            }
            this.unitsByHex.get(unit.getPosition())!.add(unit);
        }
    }

    public deleteUnit(unit: Unit) {
        this.unitsById.delete(unit.getId());

        if (!this.unitsByOwner.has(unit.getOwner())) {
            error("Unit does not exist in our records. Perhabs archives are incomplete.");
        }
        this.unitsByOwner.get(unit.getOwner())!.delete(unit);

        if (!this.unitsByHex.has(unit.getPosition())) {
            error("Unit does not exist in our records. Perhabs archives are incomplete.");
        }
        this.unitsByHex.get(unit.getPosition())!.delete(unit);
    }

    public getById(id: string) {
        return this.unitsById.get(id);
    }

    public getByOwner(owner: Nation) {
        return this.unitsByOwner.get(owner);
    }

    public getByHex(hex: Hex) {
        return this.unitsByHex.get(hex);
    }

    public getAll(): Set<Unit> {
        let result = new Set<Unit>;
        this.unitsById.forEach((unit) => {
            result.add(unit);
        })
        return result;
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new UnitRepository();
        }

        return this.instance;
    }
}