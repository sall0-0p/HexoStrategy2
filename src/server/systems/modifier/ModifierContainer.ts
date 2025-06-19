import {ModifiableProperty} from "./ModifiableProperty";
import {Modifier, ModifierType} from "./Modifier";

export class ModifierContainer {
    private modifiers = new Map<ModifiableProperty, Modifier[]>;
    private parents: ModifierContainer[];

    public constructor(parents?: ModifierContainer[]) {
        this.parents = parents ?? [];
    }

    public add(modifier: Modifier) {
        const current = this.modifiers.get(modifier.property);

        if (current) {
            current.push(modifier);
        } else {
            this.modifiers.set(modifier.property, [ modifier ])
        }
    }

    public remove(id: string) {
        this.modifiers.forEach((modifiers) => {
            modifiers.some((modifier, i) => {
                if (modifier.id === id) {
                    modifiers.remove(i);
                    return true;
                }
            })
        })
    }

    public getEffectiveValue(base: number, properies: ModifiableProperty[]) {
        let modifiers: Modifier[] = [];
        properies.forEach((property) => {
            modifiers = [ ...modifiers, ...this.getAllForProperty(property)];
            this.parents.forEach((parent) => {
                modifiers = [
                    ...modifiers,
                    ...parent.getAllForProperty(property),
                ]
            })
        })

        let flatSum = 0;
        let addSum = 0;
        let mulProd = 1;

        modifiers.forEach((mod) => {
            switch (mod.type) {
                case ModifierType.Constant:
                    flatSum += mod.value;
                    break;
                case ModifierType.Additive:
                    addSum += mod.value;
                    break;
                case ModifierType.Multiplicative:
                    mulProd *= mod.value;
                    break;
            }
        })

        let result = base + flatSum;
        result *= (1 + addSum / 100);
        result *= mulProd;

        return result;
    }

    public getAllModifiers(): Modifier[] {
        let result: Modifier[] = [];
        this.modifiers.forEach((mods) => {
            result = [ ...result, ...mods ];
        })
        return result;
    }

    public getAllForProperty(property: ModifiableProperty): Modifier[] {
        const now = DateTime.now().UnixTimestamp;
        const candidates = this.modifiers.get(property) ?? [];
        const valid = candidates.filter(m =>
            !(m.expireAt && m.expireAt < now)
        );

        this.modifiers.set(property, valid);
        return valid;
    }

    public hasModifier(id: string) {
        const modifiers = new Set(this.getAllModifiers().map((mod) => mod.id));
        return modifiers.has(id);
    }

    public getParents() {
        return this.parents;
    }

    public setParents(parents: ModifierContainer[]) {
        this.parents = parents;
    }
}