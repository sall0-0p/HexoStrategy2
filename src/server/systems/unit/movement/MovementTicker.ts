import {Hex} from "../../../world/hex/Hex";
import {Unit} from "../Unit";
import {Signal} from "../../../../shared/classes/Signal";
import {MovementSubscriptionManager} from "./MovementSubscriptionManager";
import {TimeSignalType, WorldTime} from "../../time/WorldTime";
import {ModifiableProperty} from "../../modifier/ModifiableProperty";
import {BattleRepository} from "../../battle/BattleRepository";
import {BattleService} from "../../battle/BattleService";
import {Nation} from "../../../world/nation/Nation";
import {UnitRepository} from "../UnitRepository";
import {DiplomaticRelationStatus} from "../../diplomacy/DiplomaticRelation";

type MovementData = {
    from: Hex;
    to: Hex;
    progress: number;
    finished: Signal<[]>;
};

export class MovementTicker {
    private unitsInMovement = new Map<Unit, MovementData>();
    private movementSubscriptionManager;

    private battleService = BattleService.getInstance();
    private unitRepository = UnitRepository.getInstance();
    private worldTime = WorldTime.getInstance();
    private static instance: MovementTicker;
    private constructor() {
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

        const isHexOwnerByEnemy =
            hex.getOwner()?.getRelations().getRelationStatus(unit.getOwner()) === DiplomaticRelationStatus.Enemy;
        if (unit.getCurrentMovemementOrder()?.retreating && isHexOwnerByEnemy) unit.die();

        if (this.handleBattleFor(unit, hex, data)) {
            return;
        }

        if (data.progress > 100) {
            this.finishMovement(unit);
            return;
        }

        data.progress += unit.getSpeed() * 0.10 * this.worldTime.getGameSpeed();
        unit.setOrganisation(unit.getOrganisation() - unit.getModifiers().getEffectiveValue(0, [ModifiableProperty.UnitOrganisationLossInMovement]));
    }

    private handleBattleFor(unit: Unit, hex: Hex, data: MovementData): boolean {
        const battlesHere = this.battleService.getBattlesByHex(hex);
        const inAny = this.battleService.isUnitInBattle(unit);

        if (inAny && battlesHere.size() === 0) {
            const foes = this.battleService.getEnemiesInHex(unit.getOwner(), hex);
            if (foes.size() === 0) {
                this.battleService.removeUnitFromAllBattles(unit);
            }
        }

        if (battlesHere.some(b => this.battleService.isUnitInBattle(unit, b))) {
            return true;
        }

        if (hex.getOwner() !== unit.getOwner()) {
            const foes = this.battleService.getEnemiesInHex(unit.getOwner(), hex);
            if (foes.size() > 0) {
                const friendlies = this.getFriendlyUnitsMovingInto(hex, unit.getOwner());
                if (friendlies.size() === 0) return false;

                this.battleService.engage(friendlies, hex);
                return true;
            }
        }

        return false;
    }

    private getFriendlyUnitsMovingInto(hex: Hex, nation: Nation) {
        const units = this.unitRepository.getByOwner(nation);
        const movingInto: Unit[] = [];

        units?.forEach((unit) => {
            const path = unit.getCurrentMovemementOrder()?.path;
            if (path && path[path.size() - 1] === hex) movingInto.push(unit);
        })

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
        const order = unit.getCurrentMovemementOrder();
        if (!data || !order) return undefined;

        return {
            from: order.from.getId(),
            to: order.to.getId(),
            path: order.path.map((hex) => hex.getId()),
            progress: data.progress,
            current: order.current.getId(),
        };
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new MovementTicker();
        }
        return this.instance;
    }
}
