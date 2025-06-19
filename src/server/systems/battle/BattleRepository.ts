import {Battle} from "./Battle";
import {Hex} from "../../world/hex/Hex";
import {Unit} from "../unit/Unit";
import {UnitRepository} from "../unit/UnitRepository";
import {DiplomaticRelationStatus} from "../diplomacy/DiplomaticRelation";
import {Nation} from "../../world/nation/Nation";
import {TimeSignalType, WorldTime} from "../time/WorldTime";

export class BattleRepository {
    private battlesPerHex = new Map<Hex, Battle[]>();
    private unitBattleMap = new Map<Unit, Set<Battle>>();

    private worldTime = WorldTime.getInstance();
    private unitRepository = UnitRepository.getInstance();
    private static instance: BattleRepository;
    private constructor() {
        this.worldTime.on(TimeSignalType.Hour).connect(() => this.onTick());
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

    public add(battle: Battle) {
        const hex = battle.getHex();
        const arr = this.battlesPerHex.get(hex) ?? [];
        arr.push(battle);
        this.battlesPerHex.set(hex, arr);

        // register all existing participants
        battle.getAttackingUnits().forEach(u => this.registerUnitInBattle(u, battle));
        battle.getDefendingUnits().forEach(u => this.registerUnitInBattle(u, battle));
    }

    public isUnitInBattle(unit: Unit, battle?: Battle): boolean {
        const set = this.unitBattleMap.get(unit);
        if (!set) return false;
        if (battle) {
            return set.has(battle);
        }
        // any battle?
        return set.size() > 0;
    }

    public removeUnitFromAllBattles(unit: Unit) {
        const set = this.unitBattleMap.get(unit);
        if (!set) return;
        // tell each battle to drop this unit
        set.forEach(battle => battle.removeUnit(unit));
        this.unitBattleMap.delete(unit);
    }

    public getBattlesByHex(hex: Hex): Battle[] {
        return this.battlesPerHex.get(hex) ?? [];
    }

    public getEnemiesInHex(nation: Nation, hex: Hex) {
        const units = [...this.unitRepository.getByHex(hex) ?? new Set()];

        return units.filter(enemy => {
            // only enemies…
            const isEnemy = enemy
                .getOwner()
                .getRelations()
                .getRelationStatus(nation) === DiplomaticRelationStatus.Enemy;
            if (!isEnemy) return false;

            // …and only those not currently retreating
            const order = enemy.getCurrentMovemementOrder();
            const isRetreating = order?.retreating ?? false;

            return !isRetreating;
        });
    }

    public engage(units: Unit[], hex: Hex) {
        const nation = units[0].getOwner();
        const enemies = this.getEnemiesInHex(nation, hex);

        const candidates = this.getBattlesByHex(hex).filter(b =>
            b.canJoinAsAttacker(nation) ||
            b.canJoinAsDefender(nation)
        );

        if (candidates.size() > 0) {
            const battle = candidates[0];
            if (battle.canJoinAsAttacker(nation)) {
                units.forEach(u => battle.addAttacker(u));
            } else {
                units.forEach(u => battle.addDefender(u));
            }
        } else {
            // constructor should call repo.add(this) internally
            new Battle(hex, enemies, units, this);
        }
    }

    private onTick() {
        this.battlesPerHex.forEach((battles) =>
            battles.forEach((battle) => {
                battle.tick();
            }))
    }

    // singleton
    public static getInstance() {
        if (!this.instance) {
            this.instance = new BattleRepository();
        }
        return this.instance;
    }
}
