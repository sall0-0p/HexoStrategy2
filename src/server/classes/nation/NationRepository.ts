import {JsonNation, Nation} from "./Nation";
import raw from "../../../shared/data/nations.json";

export class NationRepository {
    private nations = new Map<string, Nation>;

    private static instance: NationRepository;
    private constructor() {
        for (const [id, rawDef] of pairs(raw as Record<string, JsonNation>)) {
            print(rawDef.name);
            this.nations.set(id, new Nation(id, rawDef));
        }
    }

    public static getInstance(): NationRepository {
        if (!this.instance) {
            this.instance = new NationRepository();
        }
        return this.instance;
    }

    public getById(id: string): Nation | undefined {
        return this.nations.get(id);
    }
}

export const nationRepository = NationRepository.getInstance();