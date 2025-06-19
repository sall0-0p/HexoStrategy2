import {Hex} from "../../../world/hex/Hex";
import {Unit} from "../Unit";
import {Signal} from "../../../../shared/classes/Signal";
import {MovementSubscriptionManager} from "./MovementSubscriptionManager";
import {TimeSignalType, WorldTime} from "../../time/WorldTime";
import {ModifiableProperty} from "../../modifier/ModifiableProperty";
import {BattleRepository} from "../../battle/BattleRepository";

type MovementData = {
    from: Hex;
    to: Hex;
    progress: number;
    finished: Signal<[]>;
};

export class MovementTicker {
    private unitsInMovement = new Map<Unit, MovementData>();
    private movementSubscriptionManager;
    private battleRepository = BattleRepository.getInstance();

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
        const repo = this.battleRepository;
        const hex = data.to;
        const hexBattles = repo.getBattlesByHex(hex);
        const inAnyBattle = repo.isUnitInBattle(unit);

        if (inAnyBattle && hexBattles.size() === 0) {
            const enemiesHere = repo.getEnemiesInHex(unit.getOwner(), hex);
            if (enemiesHere.size() === 0) {
                repo.removeUnitFromAllBattles(unit);
            }
        }

        if (hexBattles.some(b => repo.isUnitInBattle(unit, b))) {
            return;
        }

        if (hex.getOwner() !== unit.getOwner()) {
            const enemies = this.battleRepository.getEnemiesInHex(unit.getOwner(), hex);
            if (enemies.size() > 0) {
                this.battleRepository.engage([unit], hex);
                return;
            }
        }

        if (data.to.getOwner() !== unit.getOwner()) {
            const enemies = this.battleRepository.getEnemiesInHex(unit.getOwner(), data.to);
            if (enemies.size() > 0) {
                this.battleRepository.engage([unit], data.to);
                return;
            }
        }

        if (data.progress > 100) {
            this.finishMovement(unit);
            return;
        }

        data.progress += unit.getSpeed() * 0.10 * this.worldTime.getGameSpeed();
        unit.setOrganisation(unit.getOrganisation() - unit.getModifierContainer().getEffectiveValue(0, [ModifiableProperty.UnitOrganisationLossInMovement]));
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
        print("Cancel Movement Called!");
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
