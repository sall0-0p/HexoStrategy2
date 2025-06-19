import {Hex} from "../../world/hex/Hex";
import {Nation} from "../../world/nation/Nation";
import {Unit} from "../unit/Unit";
import {DiplomaticRelationStatus} from "../diplomacy/DiplomaticRelation";
import {BattleRepository} from "./BattleRepository";

export class Battle {
    private id: string;
    private location: Hex;
    private attackers = new Set<Nation>;
    private defenders = new Set<Nation>;

    // units
    private attackingUnits: Unit[] = [];
    private defendingUnits: Unit[] = [];
    private attackingReserve: Unit[];
    private defendingReserve: Unit[];

    // maximums for normalisation
    private maxSoftAttack = 0;
    private maxHardAttack = 0;
    private maxDefence = 0;
    private maxBreakthrough = 0;
    private maxArmor = 0;
    private maxPiercing = 0;

    private attackingHardness = 0;
    private defendingHardness = 0;

    private battleRepository: BattleRepository;

    constructor(location: Hex, defenders: Unit[], attackers: Unit[], battleRepository: BattleRepository) {
        this.id = BattleIdCounter.getNextId();
        this.location = location;

        attackers.forEach((u) => this.attackers.add(u.getOwner()));
        defenders.forEach((u) => this.defenders.add(u.getOwner()));

        this.attackingReserve = attackers;
        this.defendingReserve = defenders;

        const powers = this.computePowers();
        this.selectUnits(this.attackingReserve, this.attackingUnits, powers);
        this.selectUnits(this.defendingReserve, this.defendingUnits, powers);

        this.battleRepository = battleRepository;
        battleRepository.add(this);
    }

    public tick() {
        const units = [...this.defendingReserve, ...this.defendingUnits, ...this.attackingUnits, ...this.attackingReserve];
        units.forEach((unit) => {
            if (unit.isDead()) this.removeUnit(unit);
        })

        this.defendingUnits.forEach((u) => {
            const debuff = (20 * this.attackingUnits.size());
            u.setOrganisation(u.getOrganisation() - debuff);
        })

        this.defendingUnits.forEach((unit) => {
            if (unit.getOrganisation() < (unit.getMaxOrganisation() * 0.05)) {
                unit.retreat();
            }
        })

        if (this.defendingUnits.size() === 0 || this.attackingUnits.size() === 0) {
            this.end();
        }
    }

    public end() {
        const units = [...this.defendingUnits, ...this.defendingReserve, ...this.attackingUnits, ...this.attackingReserve];
        units.forEach((u) =>
            this.battleRepository.unregisterUnitFromBattle(u, this));
    }

    public addAttacker(unit: Unit) {
        this.attackingReserve.push(unit);
        this.updateMaxes(unit);
        this.recomputeHardness();
        this.battleRepository.registerUnitInBattle(unit, this);
    }

    public addDefender(unit: Unit) {
        this.defendingReserve.push(unit);
        this.updateMaxes(unit);
        this.recomputeHardness();
        this.battleRepository.registerUnitInBattle(unit, this);
    }

    public getDefendingNations() {
        return this.defenders;
    }

    public getDefendingUnits() {
        return [...this.defendingUnits, ...this.defendingReserve];
    }

    public getAttackingNations() {
        return this.attackers;
    }

    public getAttackingUnits() {
        return [...this.attackingUnits, ...this.attackingReserve];
    }

    public getHex() {
        return this.location;
    }

    public removeUnit(unit: Unit) {
        if (this.getAttackingNations().has(unit.getOwner())) {
            if (this.attackingUnits.includes(unit)) {
                this.attackingUnits.remove(this.attackingUnits.indexOf(unit));
            } else if (this.attackingReserve.includes(unit)) {
                this.attackingReserve.remove(this.attackingReserve.indexOf(unit));
            }
        } else {
            if (this.defendingUnits.includes(unit)) {
                this.defendingUnits.remove(this.defendingUnits.indexOf(unit));
            } else if (this.defendingReserve.includes(unit)) {
                this.defendingReserve.remove(this.defendingReserve.indexOf(unit));
            }
        }
    }

    public canJoinAsAttacker(nation: Nation) {
        const attackers = this.getAttackingNations();
        const defenders = this.getDefendingNations();

        return [...defenders].every(def =>
            nation.getRelations().getRelationStatus(def) === DiplomaticRelationStatus.Enemy
        ) && [...attackers].every(def =>
            nation.getRelations().getRelationStatus(def) === DiplomaticRelationStatus.Allied || nation === def
        );
    }

    public canJoinAsDefender(nation: Nation): boolean {
        const attackers = this.getAttackingNations();
        const defenders = this.getDefendingNations();
        return [...attackers].every(att =>
            nation.getRelations().getRelationStatus(att) === DiplomaticRelationStatus.Enemy
        ) && [...defenders].every(att =>
            nation.getRelations().getRelationStatus(att) === DiplomaticRelationStatus.Allied || nation === att
        );
    }

    // private

    // Runs on start of battle, to pick fighting units that forces start fighting with,
    // reinforcements are based on initiative and are ticker hourly in other method.
    private selectUnits(reserves: Unit[], frontline: Unit[], powers: Map<Unit, number>) {
        const baseWidth = 70; // TODO: Implement different width with terrain, when terrain is added;
        const overlapLimit = 70 * 1.33;
        let currentWidth = this.computeWidth(frontline);

        while (currentWidth < baseWidth) {
            let bestUnder: Unit | undefined;
            let bestOver: Unit | undefined;
            let bestUnderPower = -math.huge;
            let bestOverPower = -math.huge;

            reserves.forEach((unit) => {
                const width = unit.getCombatWidth();
                const newWidth = currentWidth + width;
                const power = powers.get(unit) ?? 0;

                if (newWidth <= baseWidth && power > bestUnderPower) {
                    bestUnder = unit;
                    bestUnderPower = power;
                }

                if (newWidth > baseWidth && newWidth <= overlapLimit && power > bestOverPower) {
                    bestOver = unit;
                    bestOverPower = power;
                }
            })

            const pick = bestUnder ?? bestOver;
            if (!pick) break;

            frontline.push(pick);
            const index = reserves.indexOf(pick);
            reserves.remove(index);

            currentWidth += pick.getCombatWidth();
        }
    }

    private computeWidth(units: Unit[]) {
        let sum = 0;
        units.forEach((u) => sum += u.getCombatWidth());
        return sum;
    }

    private updateMaxes(unit: Unit) {
        if (unit.getSoftAttack() > this.maxSoftAttack) {
            this.maxSoftAttack = unit.getSoftAttack();
        }

        if (unit.getHardAttack() > this.maxHardAttack) {
            this.maxHardAttack = unit.getHardAttack();
        }

        if (unit.getDefence() > this.maxDefence) {
            this.maxDefence = unit.getDefence();
        }

        if (unit.getBreakthrough() > this.maxBreakthrough) {
            this.maxBreakthrough = unit.getBreakthrough();
        }

        if (unit.getArmor() > this.maxArmor) {
            this.maxArmor = unit.getArmor();
        }

        if (unit.getPiercing() > this.maxPiercing) {
            this.maxPiercing = unit.getPiercing();
        }
    }

    private recomputeHardness() {
        const attackers = [ ...this.attackingUnits, ...this.attackingReserve ];
        const defenders = [ ...this.defendingUnits, ...this.defendingReserve ];

        let attackersHardnessSum = 0;
        let defendersHardnessSum = 0;

        attackers.forEach((u) => attackersHardnessSum += u.getHardness());
        defenders.forEach((u) => defendersHardnessSum += u.getHardness());

        this.attackingHardness = attackersHardnessSum / attackers.size();
        this.defendingHardness = defendersHardnessSum / defenders.size();
    }

    // Runs only once, to determine initial unit pool;
    private computePowers() {
        this.attackingReserve.forEach((u) => this.updateMaxes(u));
        this.defendingReserve.forEach((u) => this.updateMaxes(u));
        const powers = new Map<Unit, number>;

        this.attackingReserve.forEach((unit) => {
            let firepower = 0;
            firepower += math.clamp(unit.getSoftAttack() / this.maxSoftAttack, 0, 1) * (1 - this.defendingHardness);
            firepower += math.clamp(unit.getHardAttack() / this.maxHardAttack, 0, 1) * this.defendingHardness;
            firepower += math.clamp(unit.getPiercing() / this.maxPiercing, 0, 1) * this.defendingHardness;
            firepower += math.clamp(unit.getBreakthrough() / this.maxBreakthrough, 0, 1) * 0.5;
            firepower += math.clamp(unit.getArmor() / this.maxArmor, 0, 1) * 0.5;

            const health = math.min(
                unit.getHp() / unit.getMaxHp(),
                unit.getOrganisation() / unit.getMaxOrganisation(),
            )
            const power = (firepower * health) / math.max(unit.getCombatWidth(), 1);
            const bonus = unit.getInitiative() * 0.05;
            powers.set(unit, power + bonus);
        })

        this.defendingReserve.forEach((unit) => {
            let firepower = 0;
            firepower += math.clamp(unit.getSoftAttack() / this.maxSoftAttack, 0, 1) * (1 - this.attackingHardness);
            firepower += math.clamp(unit.getHardAttack() / this.maxHardAttack, 0, 1) * this.attackingHardness;
            firepower += math.clamp(unit.getPiercing() / this.maxPiercing, 0, 1) * this.attackingHardness;
            firepower += math.clamp(unit.getDefence() / this.maxDefence, 0, 1);
            firepower += math.clamp(unit.getArmor() / this.maxArmor, 0, 1) * 0.25;

            const health = math.min(
                unit.getHp() / unit.getMaxHp(),
                unit.getOrganisation() / unit.getMaxOrganisation(),
            )
            const power = (firepower * health) / math.max(unit.getCombatWidth(), 1);
            const bonus = unit.getInitiative() * 0.05;
            powers.set(unit, power + bonus);
        })
        return powers;
    }
}

namespace BattleIdCounter {
    let currentId = 0;

    export function getNextId() {
        currentId++;
        return tostring(currentId);
    }
}