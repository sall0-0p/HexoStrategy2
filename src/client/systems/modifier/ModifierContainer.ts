// client/modifiers/ModifierMirror.ts
import {Modifier, ModifierParent, ModifierType} from "shared/classes/Modifier";
import { ModifiableProperty } from "shared/classes/ModifiableProperty";
import {ModifierRouter} from "./ModifierRouter";

class Bucket {
    public list: Modifier[] = [];
    public flatSum = 0;
    public addSum = 0;   // percentage points
    public mulProd = 1;  // factor
}

export class ModifierContainer {
    private id: string;
    private buckets = new Map<ModifiableProperty, Bucket>();
    private parents: ModifierContainer[] = [];

    public constructor(parentId: string, parentType: ModifierParent) {
        this.id = parentType + parentId;
        ModifierRouter.getInstance().register(this.id, this);
    }

    public applyFull(modifiers: Modifier[]) {
        this.buckets.clear();
        for (const m of modifiers) {
            let b = this.buckets.get(m.property);
            if (!b) { b = new Bucket(); this.buckets.set(m.property, b); }
            b.list.push(m);
            switch (m.type) {
                case ModifierType.Flat:
                    b.flatSum += m.value;
                    break;
                case ModifierType.Additive:
                    b.addSum += m.value; // % points
                    break;
                case ModifierType.Multiplicative:
                    b.mulProd *= m.value; // factor
                    break;
            }
        }
    }

    public setParents(parents: ModifierContainer[]) {
        this.parents = parents;
    }

    public getEffectiveValue(base: number, properties: ModifiableProperty[]) {
        let flat = 0, add = 0, mul = 1;

        const addFrom = (bucket?: Bucket) => {
            if (!bucket) return;
            flat += bucket.flatSum;
            add += bucket.addSum;
            mul *= bucket.mulProd;
        };

        for (const p of properties) {
            addFrom(this.buckets.get(p));
            for (const parent of this.parents) addFrom((parent as ModifierContainer).buckets.get(p));
        }

        let v = base + flat;
        v *= (1 + add / 100);
        v *= mul;
        return v;
    }

    public getAllModifiers(): Modifier[] {
        const out: Modifier[] = [];
        this.buckets.forEach((b) => {
            for (const m of b.list) out.push(m);
        });
        return out;
    }

    public getModifiersForProperty(property: ModifiableProperty): Modifier[] {
        const b = this.buckets.get(property);
        if (!b) return [];
        // return a shallow copy so UI can't mutate internal state
        const arr: Modifier[] = [];
        for (const m of b.list) arr.push(m);
        return arr;
    }

    public clean() {
        ModifierRouter.getInstance().unregister(this.id);
    }
}
