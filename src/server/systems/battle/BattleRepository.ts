import { Hex } from "../../world/hex/Hex";
import { Unit } from "../unit/Unit";
import { DiplomaticRelationStatus } from "../diplomacy/DiplomaticRelation";
import { Nation } from "../../world/nation/Nation";
import { UnitRepository } from "../unit/UnitRepository";
import { Battle } from "./Battle";

export class BattleRepository {
    private static instance: BattleRepository;
    private battles = new Map<string, Battle>();
    private battlesPerHex = new Map<Hex, Battle[]>();
    private unitBattleMap = new Map<Unit, Set<Battle>>();
    private unitRepo = UnitRepository.getInstance();

    private constructor() {}

    public static getInstance() {
        if (!this.instance) {
            this.instance = new BattleRepository();
        }
        return this.instance;
    }

    public add(battle: Battle) {
        const hex = battle.getHex();
        const arr = this.battlesPerHex.get(hex) ?? [];
        arr.push(battle);
        this.battlesPerHex.set(hex, arr);
        this.battles.set(battle.getId(), battle);

        battle.getUnits().attackers.forEach(u => this.registerUnitInBattle(u, battle));
        battle.getUnits().defenders.forEach(u => this.registerUnitInBattle(u, battle));
    }

    public remove(battle: Battle) {
        battle.getUnits().attackers.forEach(u => this.unregisterUnitFromBattle(u, battle));
        battle.getUnits().defenders.forEach(u => this.unregisterUnitFromBattle(u, battle));
        this.battles.delete(battle.getId());

        const arr = this.battlesPerHex.get(battle.getHex())!;
        arr.remove(arr.indexOf(battle));
        this.battlesPerHex.set(battle.getHex(), arr);
    }

    public registerUnitInBattle(unit: Unit, battle: Battle) {
        let set = this.unitBattleMap.get(unit);
        if (!set) {
            set = new Set();
            this.unitBattleMap.set(unit, set);
        }
        set.add(battle);
    }

    public unregisterUnitFromBattle(unit: Unit, battle: Battle) {
        const set = this.unitBattleMap.get(unit);
        if (!set) return;
        set.delete(battle);
        if (set.size() === 0) {
            this.unitBattleMap.delete(unit);
        }
    }

    public isUnitInBattle(unit: Unit, battle?: Battle) {
        const set = this.unitBattleMap.get(unit);
        if (!set) return false;
        return battle ? set.has(battle) : set.size() > 0;
    }

    public removeUnitFromAllBattles(unit: Unit) {
        const set = this.unitBattleMap.get(unit);
        if (!set) return;
        set.forEach(b => b.removeUnit(unit));
        this.unitBattleMap.delete(unit);
    }

    public removeUnitFromAllOffensives(unit: Unit) {
        const set = this.unitBattleMap.get(unit);
        if (!set) return;
        set.forEach(b => {
            if (b.getUnits().attackers.includes(unit)) {
                b.removeUnit(unit);
            }
        });
        this.unitBattleMap.delete(unit);
    }

    public getById(id: string): Battle | undefined {
        return this.battles.get(id);
    }

    public getBattlesByHex(hex: Hex): Battle[] {
        return this.battlesPerHex.get(hex) ?? [];
    }

    public getAllBattles(): Battle[] {
        let result: Battle[] = [];
        this.battlesPerHex.forEach((battles) => {
            result = [
                ...result,
                ...battles,
            ]
        });
        return result;
    }

    public getEnemiesInHex(nation: Nation, hex: Hex) {
        const units = [...this.unitRepo.getByHex(hex) ?? new Set<Unit>()];
        return units.filter(u => {
            const isEnemy = u
                .getOwner()
                .getRelations()
                .getRelationStatus(nation) === DiplomaticRelationStatus.Enemy;
            if (!isEnemy) return false;
            const order = u.getCurrentMovemementOrder();
            return !(order?.retreating ?? false);
        });
    }
}
