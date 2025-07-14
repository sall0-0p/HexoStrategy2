import {UnitTemplate} from "./UnitTemplate";
import {Nation} from "../../../world/nation/Nation";
import {Unit} from "../Unit";

export class TemplateRepository {
    private templatesById = new Map<string, UnitTemplate>;
    private templatesByOwner = new Map<Nation, Set<UnitTemplate>>;

    public static instance: TemplateRepository;
    private constructor() {
    }

    public addTemplate(template: UnitTemplate) {
        this.templatesById.set(template.getId(), template);

        if (!this.templatesByOwner.has(template.getOwner())) {
            this.templatesByOwner.set(template.getOwner(), new Set<UnitTemplate>);
        }
        this.templatesByOwner.get(template.getOwner())!.add(template);
    }

    public getById(id: string) {
        return this.templatesById.get(id);
    }

    public getByOwner(owner: Nation) {
        return this.templatesByOwner.get(owner);
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new TemplateRepository();
        }

        return this.instance;
    }
}