import {Hex} from "../../world/hex/Hex";
import {Nation} from "../../world/nation/Nation";
import {Unit} from "../unit/Unit";
import {DiplomaticRelationStatus} from "../diplomacy/DiplomaticRelation";
import {Signal} from "../../../shared/classes/Signal";
import {ReserveManager} from "./core/ReserveManager";
import {CombatEngine} from "./core/CombatEngine";
import {Accountant} from "./core/Accountant";
import {BattlePrediction, PredictionEngine} from "./core/PredictionEngine";
import {DTOFactory} from "./core/DTOFactory";
import {BattleSummaryDTO} from "../../../shared/dto/BattleDTO";
import {BattleUpdate} from "../../../shared/dto/BattleSubscription";

export class Battle {
    private id: string;
    private location: Hex;
    private attackers = new Set<Nation>();
    private defenders = new Set<Nation>();

    private attackingUnits: Unit[] = [];
    private defendingUnits: Unit[] = [];
    private attackingReserve: Unit[];
    private defendingReserve: Unit[];

    private lastPrediction?: BattlePrediction;

    public onUnitAdded = new Signal<[unit: Unit,isAttacker: boolean]>();
    public onBattleEnded = new Signal<[battle: Battle]>();

    constructor(location: Hex, initialDefenders: Unit[], initialAttackers: Unit[]) {
        this.id = BattleIdCounter.getNextId();
        this.location = location;
        initialAttackers.forEach(u => this.attackers.add(u.getOwner()));
        initialDefenders.forEach(u => this.defenders.add(u.getOwner()));
        this.attackingReserve = [...initialAttackers];
        this.defendingReserve = [...initialDefenders];
        const powers = Accountant.computePowers(this);
        ReserveManager.selectUnits(this, this.attackingReserve, this.attackingUnits, powers);
        ReserveManager.selectUnits(this, this.defendingReserve, this.defendingUnits, powers);
    }

    public tick(): void {
        const all = [
            ...this.defendingReserve, ...this.defendingUnits,
            ...this.attackingUnits, ...this.attackingReserve,
        ];
        all.forEach(u => u.isDead() && this.removeUnit(u));

        ReserveManager.tickReserves(this);
        ReserveManager.resetDefences(this);
        ReserveManager.buildDefences(this, this.attackingUnits, false);
        ReserveManager.buildDefences(this, this.defendingUnits, true);

        this.attackingUnits.forEach(u => CombatEngine.tick(this, u, false));
        this.defendingUnits.forEach(u => CombatEngine.tick(this, u, true));

        ReserveManager.disengage(this);
        this.lastPrediction = PredictionEngine.predictOutcome(this);

        if (this.defendingUnits.size() === 0 || this.attackingUnits.size() === 0) {
            this.end();
        }
    }

    public addAttacker(unit: Unit): void {
        this.attackingReserve.push(unit);
        this.onUnitAdded.fire(unit, true);
    }
    public addDefender(unit: Unit): void {
        this.defendingReserve.push(unit);
        this.onUnitAdded.fire(unit, false);
    }

    public removeUnit(unit: Unit): void {
        if (this.attackers.has(unit.getOwner())) {
            if (this.attackingUnits.find(u => u.getId() === unit.getId())) {
                this.attackingUnits.remove(this.attackingUnits.findIndex(u => u.getId() === unit.getId()));
            } else {
                this.attackingReserve.remove(this.attackingReserve.findIndex(u => u.getId() === unit.getId()));
            }
        } else {
            if (this.defendingUnits.find(u => u.getId() === unit.getId())) {
                this.defendingUnits.remove(this.defendingUnits.findIndex(u => u.getId() === unit.getId()));
            } else {
                this.defendingReserve.remove(this.defendingReserve.findIndex(u => u.getId() === unit.getId()));
            }
        }
    }

    public canJoinAsAttacker(n: Nation): boolean {
        return [...this.defenders].every(d => n.getRelations().getRelationStatus(d) === DiplomaticRelationStatus.Enemy)
            && [...this.attackers].every(a => n.getRelations().getRelationStatus(a) === DiplomaticRelationStatus.Allied || n === a);
    }
    public canJoinAsDefender(n: Nation): boolean {
        return [...this.attackers].every(a => n.getRelations().getRelationStatus(a) === DiplomaticRelationStatus.Enemy)
            && [...this.defenders].every(d => n.getRelations().getRelationStatus(d) === DiplomaticRelationStatus.Allied || n === d);
    }

    public getId(): string { return this.id; }
    public getHex(): Hex { return this.location; }
    public getAttackingNations(): Set<Nation> { return this.attackers; }
    public getDefendingNations(): Set<Nation> { return this.defenders; }
    public getUnits(): Units {
        return {
            attackingFrontline: this.attackingUnits,
            attackingReserve: this.attackingReserve,
            defendingFrontline: this.defendingUnits,
            defendingReserve: this.defendingReserve,
            attackers: [...this.attackingUnits, ...this.attackingReserve],
            defenders: [...this.defendingUnits, ...this.defendingReserve],
        };
    }

    public toSummaryDTO(): BattleSummaryDTO { return DTOFactory.toSummaryDTO(this); }
    public toSubscriptionEvent(): BattleUpdate { return DTOFactory.toSubscriptionEvent(this); }

    private end(): void { this.onBattleEnded.fire(this); }
}

interface Units {
    attackers: Unit[];
    defenders: Unit[];
    attackingFrontline: Unit[];
    defendingFrontline: Unit[];
    attackingReserve: Unit[];
    defendingReserve: Unit[];
}

namespace BattleIdCounter {
    let currentId = 0;
    export function getNextId(): string {
        currentId++;
        return tostring(currentId);
    }
}
