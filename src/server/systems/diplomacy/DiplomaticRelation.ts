import {Nation} from "../../world/nation/Nation";
import {NationRepository} from "../../world/nation/NationRepository";

export enum DiplomaticRelationStatus {
    Neutral = 0,
    Enemy = 1,
    Allied = 2,
}

export interface DiplomaticRelation {
    status: DiplomaticRelationStatus;
}

export class DiplomaticRelations {
    private homeNation: Nation;
    private relations = new Map<Nation, DiplomaticRelation>;

    constructor(homeNation: Nation) {
        this.homeNation = homeNation;
    }

    public getRelationStatus(nation: Nation) {
        return this.relations.get(nation)?.status ?? DiplomaticRelationStatus.Neutral;
    }

    public setRelationStatus(nation: Nation, status: DiplomaticRelationStatus, bidirectional = true) {
        this.relations.set(nation, { status });

        if (bidirectional) {
            nation
                .getRelations()
                .setRelationStatus(this.homeNation, status, false);
        }

        this.homeNation.pushRelations();
    }

    public getRelations() {
        return this.relations;
    }
}