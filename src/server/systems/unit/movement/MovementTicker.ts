import { Hex } from "../../../world/hex/Hex";
import { Unit } from "../Unit";
import { Signal } from "../../../../shared/classes/Signal";
import { MovementSubscriptionManager } from "./MovementSubscriptionManager";
import { TimeSignalType, WorldTime } from "../../time/WorldTime";
import { ModifiableProperty } from "../../../../shared/constants/ModifiableProperty";
import { BattleService } from "../../battle/misc/BattleService";
import { Nation } from "../../../world/nation/Nation";
import { UnitRepository } from "../UnitRepository";
import { DiplomaticRelationStatus } from "../../diplomacy/DiplomaticRelation";
import { MovementOrder } from "../order/MovementOrder";

type MovementData = {
    from: Hex;
    to: Hex;
    progress: number;
    finished: Signal<[]>;
};

export class MovementTicker {
    private unitsInMovement = new Map<Unit, MovementData>();
    private movementSubscriptionManager;
    private worldTime = WorldTime.getInstance();
    private static instance: MovementTicker;

    private constructor(
        private readonly onKill: (unit: Unit) => void,
        private readonly battleService: BattleService
    ) {
        this.movementSubscriptionManager = new MovementSubscriptionManager(this);
        this.worldTime.on(TimeSignalType.Tick).connect(() => this.onTick());
    }

    private onTick() {
        this.unitsInMovement.forEach((data, unit) => {
            this.tickUnit(unit, data);
            this.movementSubscriptionManager.recordProgress(unit, data.progress);
        });
        this.movementSubscriptionManager.flushProgress();
    }

    private tickUnit(unit: Unit, data: MovementData) {
        const hex = data.to;
        const unitId = unit.getId();
        const hexId = hex.getId();
        const key = unitId + "@" + hexId;

        const currentOrder = unit.getOrderQueue().getCurrent() as MovementOrder | undefined;
        const isRetreating = currentOrder?.retreating === true;
        const isHexEnemy = hex.getOwner()?.getRelations().getRelationStatus(unit.getOwner()) === DiplomaticRelationStatus.Enemy;

        if (isRetreating && isHexEnemy) {
            this.onKill(unit);
            return;
        }

        if (this.handleBattleFor(unit, hex, data)) {
            return;
        }

        if (data.progress > 100) {
            this.finishMovement(unit);
            return;
        }

        const orgRatio = unit.getOrganisation() / unit.getMaxOrganisation();
        const penalty = orgRatio > 0.2 ? 1 : 0.5;
        data.progress += unit.getSpeed() * 0.1 * this.worldTime.getGameSpeed() * penalty;
        unit.setOrganisation(
            unit.getOrganisation() -
            unit.getModifiers().getEffectiveValue(0, [ModifiableProperty.UnitOrganisationLossInMovement])
        );
    }

    private handleBattleFor(unit: Unit, hex: Hex, data: MovementData): boolean {
        const unitId = unit.getId();
        const hexId = hex.getId();
        const battlesHere = this.battleService.getBattlesByHex(hex);
        const inAny = this.battleService.isUnitInBattle(unit);

        if (inAny && battlesHere.size() === 0) {
            const foes = this.battleService.getEnemiesInHex(unit.getOwner(), hex);
            if (foes.size() === 0) {
                this.battleService.removeUnitFromAllBattles(unit);
            }
        }

        if (battlesHere.some(b => this.battleService.isUnitInBattle(unit))) {
            return true;
        }

        if (hex.getOwner() !== unit.getOwner()) {
            const foes = this.battleService.getEnemiesInHex(unit.getOwner(), hex);
            if (foes.size() > 0) {
                const friendlies = this.getFriendlyUnitsMovingInto(hex, unit.getOwner());
                if (friendlies.size() === 0) {
                    return false;
                }
                this.battleService.engage(friendlies, hex);
                return true;
            }
        }

        return false;
    }

    private getFriendlyUnitsMovingInto(hex: Hex, nation: Nation): Unit[] {
        const movingInto: Unit[] = [];
        for (const [u, data] of this.unitsInMovement) {
            if (u.getOwner() === nation && data.to === hex) {
                movingInto.push(u);
            }
        }
        return movingInto;
    }

    public scheduleMovement(unit: Unit, destination: Hex) {
        if (destination === undefined) error("Attempting movement to nil!");
        const data: MovementData = {
            from: unit.getPosition(),
            to: destination,
            progress: 0,
            finished: new Signal<[]>(),
        };
        this.unitsInMovement.set(unit, data);
        return data;
    }

    public scheduleOrder(unit: Unit) {
        this.movementSubscriptionManager.recordStarted(unit);
    }

    public cancelMovement(unit: Unit) {
        this.unitsInMovement.delete(unit);
        this.movementSubscriptionManager.recordEnd(unit);
        this.battleService.removeUnitFromAllOffensives(unit);
    }

    private finishMovement(unit: Unit) {
        const data = this.unitsInMovement.get(unit);
        if (!data) error("Trying to finish unexistent movement!");
        this.unitsInMovement.delete(unit);
        unit.setPosition(data.to);
        data.finished.fire();
        this.movementSubscriptionManager.recordUpdate(unit);
    }

    public notifyReached(unit: Unit) {
        this.movementSubscriptionManager.recordEnd(unit);
    }

    public getMovementInfo(unit: Unit): {
        from: string;
        to: string;
        path: string[];
        progress: number;
        current: string;
    } | undefined {
        const data = this.unitsInMovement.get(unit);
        const order = unit.getOrderQueue().getCurrent() as MovementOrder | undefined;
        if (!data || !order) return undefined;
        return {
            from: order.getSource()?.getId() ?? "",
            to: order.getDestination().getId(),
            path: order.getPath().map(h => h.getId()),
            progress: data.progress,
            current: order.getCurrentHex().getId(),
        };
    }

    public static getInstance(onKill?: (u: Unit) => void, battleService?: BattleService) {
        if (!this.instance && onKill && battleService) {
            this.instance = new MovementTicker(onKill, battleService);
        }
        return this.instance;
    }
}
