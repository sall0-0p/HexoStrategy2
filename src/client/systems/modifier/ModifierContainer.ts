// client/modifiers/ModifierMirror.ts
import {Modifier, ModifierParent, ModifierType, ModifierVibe} from "shared/classes/Modifier";
import {ModifiableProperty} from "shared/classes/ModifiableProperty";
import {ModifierRouter} from "./ModifierRouter";
import {TextUtils} from "../../../shared/classes/TextUtils";
import {RTColor} from "../../../shared/config/RichText";
import {Signal} from "../../../shared/classes/Signal";

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
    public updated: Signal<[]> = new Signal();

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

        this.updated.fire();
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
        const arr: Modifier[] = [];
        for (const m of b.list) arr.push(m);
        return arr;
    }

    private formatModifierValue(m: Modifier): string {
        switch (m.type) {
            case ModifierType.Flat:
                return (m.value >= 0 ? `+${m.value}` : `${m.value}`);
            case ModifierType.Additive:
                return (m.value >= 0 ? `+${m.value}%` : `${m.value}%`);
            case ModifierType.Multiplicative:
                return `x${m.value}`;
            default:
                return "";
        }
    }

    private resolveValueColor(modifier: Modifier, value: number, invert: boolean): RTColor {
        if (modifier.vibe === ModifierVibe.Neutral) return RTColor.Important;

        if (modifier.vibe === ModifierVibe.Positive && !invert) {
            return (value >= 0) ? RTColor.Green : RTColor.Red;
        } else {
            return (value <= 0) ? RTColor.Red : RTColor.Green;
        }
    }

    /* Produces string of modifiers for property to be used inside RichTextComponent */
    public getModifierBreakdown(property: ModifiableProperty, invertVibe: boolean = false): string {
        let result = "";
        const modifiers = this.getModifiersForProperty(property);
        modifiers.forEach((m, i) => {
            const iconColor = TextUtils.color3ToRTG(m.iconColor ?? Color3.fromRGB(255, 255, 255));
            const prefix = i !== 0 ? `<br/>` : ``;
            const icon = m.icon ? `<icon src="${m.icon}" color="${iconColor}"/> ` : ``
            const value = this.formatModifierValue(m);
            const valueColor = this.resolveValueColor(m, m.value, invertVibe);
            const body = `${icon}${m.label}: <color value="${valueColor}">${value}</color>`;
            result = result + prefix + body;
        })
        return result;
    }

    public clean() {
        ModifierRouter.getInstance().unregister(this.id);
    }
}
