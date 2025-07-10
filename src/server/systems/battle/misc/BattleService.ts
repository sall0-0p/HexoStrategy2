// src/game/battle/BattleService.ts
import { Battle } from "../Battle";
import { BattleRepository } from "./BattleRepository";
import { Unit } from "../../unit/Unit";
import { Nation } from "../../../world/nation/Nation";
import { Hex } from "../../../world/hex/Hex";
import { WorldTime, TimeSignalType } from "../../time/WorldTime";
import { BattleReplicator } from "./BattleReplicator";
import { BattleSubscription } from "./BattleSubscription";

export class BattleService {
    private static instance: BattleService;
    private repo = BattleRepository.getInstance();
    private worldTime = WorldTime.getInstance();
    private battleReplicator = BattleReplicator.getInstance();
    private battleSubscription = new BattleSubscription();

    private constructor() {
        this.worldTime.on(TimeSignalType.Hour).connect(() => this.tickAll());
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new BattleService();
        }
        return this.instance;
    }

    public engage(units: Unit[], hex: Hex) {
        const nation = units[0].getOwner();
        const enemies = this.repo.getEnemiesInHex(nation, hex);
        const existing = this.repo
            .getBattlesByHex(hex)
            .filter(b =>
                b.canJoinAsAttacker(nation) ||
                b.canJoinAsDefender(nation)
            );

        if (existing.size() > 0) {
            const battle = existing[0];

            units = units.filter((u) =>
                !this.isUnitInBattle(u, battle)); // Filter units that are already in that battle.

            if (battle.canJoinAsAttacker(nation)) {
                units.forEach(u => this.addAttacker(battle, u));
            } else {
                units.forEach(u => this.addDefender(battle, u));
            }
        } else {
            const battle = new Battle(hex, enemies, units);
            this.registerBattle(battle);
        }
    }

    // TODO: Potential memory leak.
    private registerBattle(battle: Battle) {
        this.repo.add(battle);
        battle.onUnitAdded.connect((unit, isAttacker) => {
            this.repo.registerUnitInBattle(unit, battle);
            // Hook: replication on add
        });
        battle.onBattleEnded.connect(() => {
            this.repo.remove(battle);
            // Hook: replication on end
        });
    }

    public addAttacker(battle: Battle, unit: Unit) {
        battle.addAttacker(unit);
    }

    public addDefender(battle: Battle, unit: Unit) {
        battle.addDefender(unit);
    }

    public isUnitInBattle(unit: Unit, battle?: Battle) {
        return this.repo.isUnitInBattle(unit, battle);
    }

    public getBattlesByHex(hex: Hex) {
        return this.repo.getBattlesByHex(hex);
    }

    public getEnemiesInHex(nation: Nation, hex: Hex) {
        return this.repo.getEnemiesInHex(nation, hex);
    }

    public removeUnitFromAllBattles(unit: Unit) {
        this.repo.removeUnitFromAllBattles(unit);
    }

    public removeUnitFromAllOffensives(unit: Unit) {
        this.repo.removeUnitFromAllOffensives(unit);
    }

    private tickAll() {
        this.repo.getAllBattles().forEach(b => {
            b.tick();
        });
        this.battleReplicator.onTick();
        this.battleSubscription.onTick();
    }
}
