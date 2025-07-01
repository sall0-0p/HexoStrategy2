import {Hex} from "../../world/hex/Hex";
import {Nation} from "../../world/nation/Nation";
import {Unit} from "../unit/Unit";
import {DiplomaticRelationStatus} from "../diplomacy/DiplomaticRelation";
import {Signal} from "../../../shared/classes/Signal";
import {ArrayShuffle} from "../../../shared/classes/ArrayShuffle";
import {ModifiableProperty} from "../modifier/ModifiableProperty";

let dumped = false;
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

    private defences = new Map<Unit, number>();
    private maxWidth = 0;

    public onUnitAdded = new Signal<[unit: Unit, isAttacker: boolean]>();
    public onBattleEnded = new Signal<[battle: Battle]>();

    constructor(location: Hex, initialDefenders: Unit[], initialAttackers: Unit[]) {
        this.id = BattleIdCounter.getNextId();
        this.location = location;

        initialAttackers.forEach((u) => this.attackers.add(u.getOwner()));
        initialDefenders.forEach((u) => this.defenders.add(u.getOwner()));

        this.attackingReserve = [...initialAttackers];
        this.defendingReserve = [...initialDefenders];

        this.recomputeMaxWidth();
        const powers = this.computePowers();
        this.selectUnits(this.attackingReserve, this.attackingUnits, powers);
        this.selectUnits(this.defendingReserve, this.defendingUnits, powers);
    }

    public tick() {
        const all = [
            ...this.defendingReserve, ...this.defendingUnits,
            ...this.attackingUnits, ...this.attackingReserve,
        ];
        all.forEach(u => u.isDead() && this.removeUnit(u));

        this.tickReserves();
        this.buildDefences();

        this.attackingUnits.forEach((unit) => this.tickAttack(unit, false));
        this.defendingUnits.forEach((unit) => this.tickAttack(unit, true));

        this.disengageLosers();

        const prediction = this.predictOutcome();
        print(`Battle will finish in ${prediction.hours} hours. Winning side: ${prediction.score > 0 ? "Attackers" : "Defenders"} (${prediction.score}`);
        print(`Attackers: ${this.attackingUnits.size()}:${this.attackingReserve.size()}; Defenders: ${this.defendingUnits.size()}:${this.defendingReserve.size()}`);

        if (this.defendingUnits.size() === 0 || this.attackingUnits.size() === 0) {
            this.end();
        }
    }

    private tickReserves() {
        this.defendingReserve.forEach((unit) => this.tickUnitInReserve(unit, true));
        this.attackingReserve.forEach((unit) => this.tickUnitInReserve(unit, false));
    }

    private disengageLosers() {
        this.defendingUnits.forEach((unit) => {
            if (unit.getOrganisation() / unit.getMaxOrganisation() < 0.05) {
                unit.retreat();
                this.removeUnit(unit);
            }
        })

        this.attackingUnits.forEach((unit) => {
            if (unit.getOrganisation() / unit.getMaxOrganisation() < 0.05) {
                unit.getCurrentMovemementOrder()?.cancel();
                this.removeUnit(unit);
            }
        })
    }

    private tickUnitInReserve(unit: Unit, isDefender: boolean) {
        let combatWidth = 0;
        if (isDefender) {
            this.defendingUnits.forEach((u) => combatWidth += u.getCombatWidth());
        } else {
            this.attackingUnits.forEach((u) => combatWidth += u.getCombatWidth());
        }

        const potentialWidth = combatWidth + unit.getCombatWidth();
        if (potentialWidth > this.maxWidth * 1.33) return;
        const overflow = potentialWidth > this.maxWidth;

        const roll = math.random(1, 100) * 0.01;
        const chance = 0.02 * (1 + unit.getInitiative()) * (overflow ? 0.5 : 1);
        if (roll < chance) {
            if (isDefender) {
                this.defendingReserve.remove(this.defendingReserve.indexOf(unit));
                this.defendingUnits.push(unit);
            } else {
                this.attackingReserve.remove(this.attackingReserve.indexOf(unit));
                this.attackingUnits.push(unit);
            }
        }
    }

    private tickAttack(unit: Unit, isDefender: boolean) {
        const targets = this.selectTargets(unit,
            isDefender ? this.attackingUnits : this.defendingUnits);
        if (targets.size() === 0) { return; }

        // Determine enemy average hardness
        let sumHardness = 0
        targets.forEach((t) => sumHardness += t.getHardness());
        const averageHardness = sumHardness / targets.size();

        const baseAttack = averageHardness * unit.getHardAttack()
            + (1 - averageHardness) * unit.getSoftAttack();
        const totalAttack = unit.getModifiers().getEffectiveValue(baseAttack, [ModifiableProperty.UnitTotalAttack]);
        const attackCount = math.round(totalAttack / 10);

        const attacks = this.allocateAttacks(unit, targets, attackCount);

        attacks.forEach((count, target) => {
            for (let i = 0; i < count; i++) {
                this.attack(unit, target);
            }
        });
    }

    private attack(unit: Unit, target: Unit) {
        const hitChance = (this.defences.get(target) ?? 0 > 0) ? 0.1 : 0.4;
        const roll = math.random(0, 100) * 0.01;

        if (roll > hitChance) return; // missed

        const unitHp = unit.getHp() / unit.getMaxHp();
        const orgDieSize = unit.getArmor() > target.getPiercing() ? 6 : 4
        const hpDamage = (math.random(1, 2) * 0.06) * unitHp;
        const orgDamage = (math.random(1, orgDieSize) * 0.053) * unitHp;

        target.setHp(target.getHp() - hpDamage);
        target.setOrganisation((target.getOrganisation() - orgDamage));
    }

    private allocateAttacks(unit: Unit, targets: Unit[], count: number) {
        if (count <= 0) return new Map<Unit, number>();
        const coordinatedShare = 0.35 * (1 + unit.getInitiative());
        const coordinatedCount = math.clamp(math.floor(count * coordinatedShare),
            0, count);
        const normalCount = count - coordinatedCount;

        const priority = this.chooseBestTarget(unit, targets);

        let totalWidth = 0;
        targets.forEach((t) => totalWidth += t.getCombatWidth());

        let uncoordinatedCount = 0;
        const uncoordinated = new Map<Unit, number>();
        targets.forEach((target) => {
            const share = target.getCombatWidth() / totalWidth;
            uncoordinated.set(target, math.floor(normalCount * share));
            uncoordinatedCount += math.floor(normalCount * share);
        })

        uncoordinated.set(priority, (uncoordinated.get(priority) ?? 0) + coordinatedCount);
        return uncoordinated;
    }

    private chooseBestTarget(attacker: Unit, targets: Unit[]) {
        let best: Unit | undefined;
        let bestScore = -math.huge;

        targets.forEach((target) => {
            const hardnessFactor =
                ((attacker.getHardAttack() * (1 - target.getHardness())) +
                    (attacker.getHardAttack() * target.getHardness()))  // bias for hard attacks
                / math.max(target.getCombatWidth(), 1);

            const armorMultiplier = target.getArmor() > attacker.getPiercing() ? 0.5 : 1;

            const orgRatio = target.getOrganisation() / target.getMaxOrganisation();
            const orgBonus = 1 - (orgRatio / 4);

            const score = hardnessFactor * armorMultiplier * orgBonus;

            if (score > bestScore) {
                bestScore = score;
                best = target;
            }
        })

        return best!;
    }

    private selectTargets(attacker: Unit, enemies: Unit[]) {
        if (enemies.size() === 0) return [];
        const engagementWidth = attacker.getCombatWidth() * 2;
        const shuffled = ArrayShuffle.shuffle([...enemies]) as Unit[];
        const fit: Unit[] = [];
        let used = 0;

        shuffled.forEach((enemy) => {
            if (used + enemy.getCombatWidth() <= engagementWidth) {
                fit.push(enemy);
                used += enemy.getCombatWidth();
            }
        })

        if (fit.size() > 0) {
            return fit;
        } else {
            return [shuffled[math.random(0, shuffled.size() - 1)]];
        }
    }

    private buildDefences() {
        this.defences.clear();
        this.defendingUnits.forEach((unit) => {
            const base = unit.getDefence() / 10;
            this.defences.set(unit, math.round(base));
        })

        this.attackingUnits.forEach((unit) => {
            const base = unit.getBreakthrough() / 10;
            this.defences.set(unit, math.round(base));
        })
    }

    private end() {
        this.onBattleEnded.fire(this);
    }

    public addAttacker(unit: Unit) {
        this.attackingReserve.push(unit);
        this.updateMaxes(unit);
        this.recomputeMaxWidth();
        this.recomputeHardness();
        this.onUnitAdded.fire(unit, true);
    }

    public addDefender(unit: Unit) {
        this.defendingReserve.push(unit);
        this.updateMaxes(unit);
        this.recomputeHardness();
        this.onUnitAdded.fire(unit, false);
    }

    public getUnits() {
        return {
            attackingFrontline: this.attackingUnits,
            attackingReserve: this.attackingReserve,
            defendingFrontline: this.defendingUnits,
            defendingReserve: this.defendingReserve,
        }
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
        if (this.attackers.has(unit.getOwner())) {
            if (this.attackingUnits.find((u) => unit.getId() === u.getId())) {
                this.attackingUnits.remove(this.attackingUnits.findIndex((u) => unit.getId() === u.getId()));
            } else if (this.attackingReserve.find((u) => unit.getId() === u.getId())) {
                this.attackingReserve.remove(this.attackingReserve.findIndex((u) => unit.getId() === u.getId()));
            }
        } else {
            if (this.defendingUnits.find((u) => unit.getId() === u.getId())) {
                this.defendingUnits.remove(this.defendingUnits.findIndex((u) => unit.getId() === u.getId()));
            } else if (this.defendingReserve.find((u) => unit.getId() === u.getId())) {
                this.defendingReserve.remove(this.defendingReserve.findIndex((u) => unit.getId() === u.getId()));
            }
        }

        this.recomputeMaxWidth();
        this.recomputeHardness();
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
        const baseWidth = this.maxWidth;
        const overlapLimit = baseWidth * 1.33;
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

    private recomputeMaxWidth() {
        // Determine by terrain.
        const baseWidth = 70;
        const flankWidth = baseWidth / 2;

        const allAttackers = [ ...this.attackingUnits, ...this.attackingReserve ];
        const directions: Set<Hex> = new Set();

        allAttackers.forEach((unit) => directions.add(unit.getPosition()));
        const flankingDirections = directions.size() - 1;
        this.maxWidth = baseWidth + (flankWidth * flankingDirections);
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
        const allAttackers = [ ...this.attackingUnits, ...this.attackingReserve ];
        const allDefenders = [ ...this.defendingUnits, ...this.defendingReserve ];

        let attackersHardnessSum = 0;
        let defendersHardnessSum = 0;

        attackers.forEach((u) => attackersHardnessSum += u.getHardness());
        defenders.forEach((u) => defendersHardnessSum += u.getHardness());

        this.attackingHardness = attackersHardnessSum / allAttackers.size();
        this.defendingHardness = defendersHardnessSum / allDefenders.size();
    }

    // Runs only once, to determine initial unit pool;
    private computePowers() {
        this.attackingReserve.forEach((u) => this.updateMaxes(u));
        this.defendingReserve.forEach((u) => this.updateMaxes(u));
        const powers = new Map<Unit, number>;

        this.recomputeHardness();

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

    // Prediction
    private predictOutcome(): BattlePrediction {
        const attackingOrganisation = this.attackingUnits.reduce(
            (sum, u) => sum + u.getOrganisation(), 0);
        const defendingOrganisation = this.defendingUnits.reduce(
            (sum, u) => sum + u.getOrganisation(), 0);

        const attackingDamageApproximation = this.approximateDamagePerHour(this.attackingUnits, this.defendingUnits, false);
        const defendingDamageApproximation = this.approximateDamagePerHour(this.defendingUnits, this.attackingUnits, true);

        const hoursToKillDefenders = defendingOrganisation / attackingDamageApproximation;
        const hoursToKillAttackers = attackingOrganisation / defendingDamageApproximation;

        const hours = math.min(hoursToKillDefenders, hoursToKillAttackers);
        const score = (hoursToKillAttackers - hoursToKillDefenders)
            / math.max(hoursToKillAttackers, hoursToKillDefenders);

        return {
            hours,
            score,
        }
    }

    private approximateDamagePerHour(attackers: Unit[], defenders: Unit[], useBreakthrough: boolean) {
        let totalAttacks = 0;
        let totalDefences = 0;

        attackers.forEach(u => {
            const hardness = this.averageHardness(defenders);
            const base = hardness * u.getHardAttack() + (1 - hardness) * u.getSoftAttack();
            const totalAtk = u.getModifiers()
                .getEffectiveValue(base, [ModifiableProperty.UnitTotalAttack]);
            totalAttacks += math.round(totalAtk / 10);
        });

        defenders.forEach(u => {
            const defence = useBreakthrough ? u.getBreakthrough() : u.getDefence();
            totalDefences += math.round(defence / 10);
        });

        const hitsWithDefence = math.min(totalAttacks, totalDefences);
        const hitsWithout = math.max(0, totalAttacks - totalDefences);
        const expectedHits = hitsWithDefence * 0.1 + hitsWithout * 0.4;

        const averageOrganisationDie = 2.5;
        const damageMultiplier = 0.053;
        const averageHpFactor = 1;
        const orgPerHit = averageOrganisationDie * damageMultiplier * averageHpFactor;

        return math.max(expectedHits * orgPerHit, 0.01);
    }

    private averageHardness(units: Unit[]) {
        return units.reduce((sum, u) => sum += u.getHardness(), 0) / units.size();
    }
}

export interface BattlePrediction {
    hours: number,
    score: number,
}

namespace BattleIdCounter {
    let currentId = 0;

    export function getNextId() {
        currentId++;
        return tostring(currentId);
    }
}