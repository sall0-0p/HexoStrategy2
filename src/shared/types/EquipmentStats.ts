export type EquipmentStats = LandEquipmentStats;

export class LandEquipmentStats {
    public speed: number;
    public hp: number;
    public organisation: number;
    public recovery: number;
    public softAttack: number;
    public hardAttack: number;
    public defence: number;
    public breakthrough: number;
    public armor: number;
    public piercing: number;
    public initiative: number;
    public hardness: number;

    constructor(init?: Partial<EquipmentStats>) {
        this.speed = init?.speed ?? 0;
        this.hp = init?.hp ?? 0;
        this.organisation = init?.organisation ?? 0;
        this.recovery = init?.recovery ?? 0;
        this.softAttack = init?.softAttack ?? 0;
        this.hardAttack = init?.hardAttack ?? 0;
        this.defence = init?.defence ?? 0;
        this.breakthrough = init?.breakthrough ?? 0;
        this.armor = init?.armor ?? 0;
        this.piercing = init?.piercing ?? 0;
        this.initiative = init?.initiative ?? 0;
        this.hardness = init?.hardness ?? 0;
    }

    public static zero(): EquipmentStats {
        return new LandEquipmentStats();
    }
}
