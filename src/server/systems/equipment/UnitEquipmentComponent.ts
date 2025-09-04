import {EquipmentStockpile} from "./EquipmentStockpile";
import {Unit} from "../unit/Unit";
import {TimeSignalType, WorldTime} from "../time/WorldTime";
import {EquipmentArchetype} from "../../../shared/constants/EquipmentArchetype";
import {EquipmentReservation} from "./EquipmentReservation";
import {NationEquipmentComponent} from "./NationEquipmentComponent";
import {TemporaryEquipmentHelper} from "./TemporaryEquipmentHelper";

export class UnitEquipmentComponent {
    private readonly stockpile = new EquipmentStockpile();
    private max: Map<EquipmentArchetype, number> = new Map();
    private reservations: Set<EquipmentReservation> = new Set();

    constructor(
        private readonly unit: Unit
    ) {
        const connection1 =
            WorldTime.getInstance().on(TimeSignalType.Hour)
                .connect(() => this.update());

        this.unit.destroying.once(() => {
            connection1.disconnect();
        });

        this.max = this.unit.getTemplate().getEquipment();
        this.fillStockpileForDebug();
    }

    // TODO: Remove when production / recruitment arrives.
    private fillStockpileForDebug() {
        this.max.forEach((n, a) => {
            const eq = TemporaryEquipmentHelper.create(this.unit.getOwner(), a);
            this.stockpile.addEquipment(eq, n);
        })
    }

    // Runs every in-game day;
    private update() {
        this.max = this.unit.getTemplate().getEquipment();

        this.requestResupply();

        if (this.stockpile.changed) {
            this.recomputeHp();
            this.stockpile.changed = false;
        }
    }

    private requestResupply() {
        const deficits = new Map<EquipmentArchetype, number>();

        this.max.forEach((max, archetype) => {
            const current = this.stockpile.getEquipmentCountForArchetype(archetype);
            const missing = math.max(0, max - current);
            if (missing > 0) deficits.set(archetype, missing);
        });

        if (deficits.size() === 0) return;

        this.reservations.forEach(res => {
            res.getAllProgress().forEach(({delivered, needed}, archetype) => {
                const outstanding = needed - delivered;
                if (outstanding > 0) {
                    const currentDef = deficits.get(archetype) ?? 0;
                    deficits.set(archetype, math.max(0, currentDef - outstanding));
                }
            });

            if (res.isComplete()) this.reservations.delete(res);
        });

        let anyDeficit = false;
        deficits.forEach((missing, archetype) => {
            if (missing > 0) anyDeficit = true;
        });

        if (anyDeficit) {
            const nationEquip: NationEquipmentComponent = this.unit.getOwner().getEquipment();

            const newReservation = nationEquip.createReservation(new EquipmentReservation(
                deficits,
                (payload) => {
                    payload.forEach((count, eType) => {
                        this.stockpile.addEquipment(eType, count);
                    });
                },
                () => {
                    this.reservations.delete(newReservation);
                    print(`Resupply complete for ${this.unit.getName()}`);
                }
            ));

            this.reservations.add(newReservation);
        }

    }

    public applyLosses(hp: number) {
        const relation = hp / this.unit.getMaxHp();
        this.stockpile.multiplyAllBy(math.min(1 - relation, 1));
    }

    // TODO: Make weighted when actual unit stats arrive.
    public recomputeHp() {
        let average = 0;
        let count = 0;
        this.max.forEach((max, a) => {
            const current = this.stockpile.getEquipmentCountForArchetype(a);
            average += (current / max);

            if (max > 0) {
                count++;
            }
        })

        if (count > 0) {
            const fullness = average / count;
            const hp = this.unit.getMaxHp() * fullness
            this.unit.setHp(math.clamp(hp, 0, this.unit.getMaxHp()));
        }
    }

    public getStockpile() {
        return this.stockpile;
    }

    public getUnit() {
        return this.unit;
    }
}