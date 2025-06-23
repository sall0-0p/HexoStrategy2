import {UnitRepository} from "./UnitRepository";
import {TimeSignalType, WorldTime} from "../time/WorldTime";
import {BattleRepository} from "../battle/BattleRepository";

export class UnitRecoveryTicker {

    private unitRepository = UnitRepository.getInstance();
    private battleRepository = BattleRepository.getInstance();
    private worldTime = WorldTime.getInstance();
    private static instance: UnitRecoveryTicker;
    private constructor() {
        this.worldTime.on(TimeSignalType.Hour).connect(() => this.onTick());
    }

    private onTick() {
        const units = this.unitRepository.getAll();

        units.forEach((unit) => {
            if (unit.getOrganisation() / unit.getMaxOrganisation() === 1) return;
            const inBattle = this.battleRepository.isUnitInBattle(unit);

            if (unit.getCurrentMovemementOrder() && !inBattle) {
                unit.setOrganisation(math.clamp(unit.getOrganisation() - 0.2, 0, unit.getMaxOrganisation()));
                return;
            }

            if (inBattle) return;

            const recoveryRate = 0.25 + unit.getRecoveryRate();
            unit.setOrganisation(math.clamp(
                unit.getOrganisation() + recoveryRate,
                0, unit.getMaxOrganisation()))
        })
    }

    public static getInstance(){
        if (!this.instance) {
            this.instance = new UnitRecoveryTicker();
        }

        return this.instance;
    }
}