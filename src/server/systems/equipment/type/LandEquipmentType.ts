import {BaseEquipmentType} from "./BaseEquipmentType";
import {LandEquipmentArchetype} from "../../../../shared/constants/EquipmentArchetype";
import {LandEquipmentStats} from "../../../../shared/types/EquipmentStats";
import {Nation} from "../../../world/nation/Nation";
import {EquipmentKind, LandEquipmentDTO} from "../../../../shared/network/tether/messages/EquipmentEmitter";
import {EquipmentTypeRepository} from "./EquipmentTypeRepository";

export class LandEquipmentType extends BaseEquipmentType {
    constructor(owner: Nation, archetype: LandEquipmentArchetype, name: string, icon: string, private stats: LandEquipmentStats, parent?: LandEquipmentType) {
        super(owner, archetype, name, icon, EquipmentKind.Land, parent);
        EquipmentTypeRepository.getInstance().register(this);
    }

    public getStats() {
        return this.stats;
    }

    public setStats(stats: LandEquipmentStats) {
        this.stats = stats;
        this.changed.fire();
    }

    public updateStats(delta: Partial<LandEquipmentStats>) {
        this.changed.fire();

        for (const [k, v] of pairs(delta)) {
            this.stats[k] = v as never;
        }
    }

    public clone(owner: Nation, name: string, delta?: Partial<LandEquipmentStats>) {
        const newStats: LandEquipmentStats = { ...this.stats };

        if (delta) {
            for (const [k, v] of pairs(delta)) {
                newStats[k] = v as never;
            }
        }

        return new LandEquipmentType(owner, this.getArchetype() as LandEquipmentArchetype, name, this.getIcon(), newStats, this);
    }

    public toDTO(): LandEquipmentDTO {
        return {
            id: this.getId(),
            owner: this.getOwner().getId(),
            archetype: this.getArchetype(),
            name: this.getName(),
            icon: this.getIcon(),
            generation: this.getGeneration(),
            outdated: this.isOutdated(),
            kind: EquipmentKind.Land,
            parentId: this.getParent()?.getId(),
            stats: this.getStats(),
        }
    }
}