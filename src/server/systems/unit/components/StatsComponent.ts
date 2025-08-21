import {ModifierContainer} from "../../modifier/ModifierContainer";
import {Signal} from "../../../../shared/classes/Signal";
import {UnitTemplate} from "../template/UnitTemplate";
import {ModifiableProperty} from "../../../../shared/classes/ModifiableProperty";
import {Unit} from "../Unit";
import {ModifierParent} from "../../../../shared/classes/Modifier";

export enum StatKey {
    Speed = "unitSpeed",
    Hp = "hp",
    MaxHp = "maxHp",
    Organisation = "organisation",
    MaxOrganisation = "maxOrganisation",
    RecoveryRate = "recoveryRate",
    SoftAttack = "softAttack",
    HardAttack = "hardAttack",
    Defence = "defence",
    Breakthrough = "breakthrough",
    Armor = "armor",
    Piercing = "piercing",
    Initiative = "initiative",
    CombatWidth = "combatWidth",
    Hardness = "hardness",
}

type ModifiableStatKey =
    | StatKey.Speed
    | StatKey.Organisation
    | StatKey.RecoveryRate
    | StatKey.SoftAttack
    | StatKey.HardAttack
    | StatKey.Defence
    | StatKey.Breakthrough
    | StatKey.Armor
    | StatKey.Piercing
    | StatKey.Initiative;


const statModMap: Record<ModifiableStatKey, ModifiableProperty> = {
    [StatKey.Speed]:           ModifiableProperty.UnitSpeed,
    [StatKey.Organisation]:    ModifiableProperty.UnitOrganisation,
    [StatKey.RecoveryRate]:    ModifiableProperty.UnitRecoveryRate,
    [StatKey.SoftAttack]:      ModifiableProperty.UnitSoftAttack,
    [StatKey.HardAttack]:      ModifiableProperty.UnitHardAttack,
    [StatKey.Defence]:         ModifiableProperty.UnitDefence,
    [StatKey.Breakthrough]:    ModifiableProperty.UnitBreakthrough,
    [StatKey.Armor]:           ModifiableProperty.UnitArmor,
    [StatKey.Piercing]:        ModifiableProperty.UnitPiercing,
    [StatKey.Initiative]:      ModifiableProperty.UnitInitiative,
};

type StatValues = Record<StatKey, number>;
export class StatsComponent {
    private base: StatValues;
    private current: StatValues;
    private readonly modifiers: ModifierContainer;

    public readonly changed = new Signal<[StatKey, number]>();

    constructor(unit: Unit, template: UnitTemplate) {
        this.base = {
            [StatKey.Speed]: template.getSpeed(),
            [StatKey.Hp]: template.getHp(),
            [StatKey.MaxHp]: template.getHp(),
            [StatKey.Organisation]: template.getOrganisation(),
            [StatKey.MaxOrganisation]: template.getOrganisation(),
            [StatKey.RecoveryRate]: template.getRecovery(),
            [StatKey.SoftAttack]: template.getSoftAttack(),
            [StatKey.HardAttack]: template.getHardAttack(),
            [StatKey.Defence]: template.getDefence(),
            [StatKey.Breakthrough]: template.getBreakthrough(),
            [StatKey.Armor]: template.getArmor(),
            [StatKey.Piercing]: template.getPiercing(),
            [StatKey.Initiative]: template.getInitiative(),
            [StatKey.CombatWidth]: template.getCombatWidth(),
            [StatKey.Hardness]: template.getHardness(),
        };

        this.current = { ...this.base };
        this.modifiers = new ModifierContainer(unit.getId(), ModifierParent.Unit);
    }

    private isModifiableKey(k: StatKey): k is ModifiableStatKey {
        return k in statModMap;
    }

    public get(key: StatKey): number {
        const base = this.current[key];

        if (this.isModifiableKey(key)) {
            const prop = statModMap[key];
            const eff  = this.modifiers
                .getEffectiveValue(base, [prop]);
            if (eff !== this.current[key]) {
                this.current[key] = eff;
                this.changed.fire(key, eff);
            }
            return eff;
        }

        return base;
    }

    public set(key: StatKey, value: number) {
        this.current[key] = value;
        this.changed.fire(key, value);
    }

    public getModifierContainer() {
        return this.modifiers;
    }
}