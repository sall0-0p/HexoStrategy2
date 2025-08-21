import {Modifier, ModifierParent, ModifierType} from "../../../shared/classes/Modifier";
import {ModifiableProperty} from "../../../shared/classes/ModifiableProperty";
import {MessageData, MessageType, ModifiersEmitter} from "../../../shared/tether/messages/Modifiers";
import {TimeSignalType, WorldTime} from "../time/WorldTime";

class Bucket {
    public modifiers = new Map<string, Modifier>;
    public flatSum = 0;
    public addSum = 0;
    public mulProd = 1;
    private dirty = false;
    private nextExpiry?: number;

    public add(m: Modifier) {
        print(m.expireAt);
        const existed = this.modifiers.get(m.id);
        if (existed) this.delta(existed, -1);
        this.modifiers.set(m.id, m);
        this.delta(m, 1);
        if (m.expireAt !== undefined) {
            this.nextExpiry = this.nextExpiry === undefined ? m.expireAt : math.min(this.nextExpiry, m.expireAt);
        }
    }

    public remove(id: string): boolean {
        const m = this.modifiers.get(id);
        if (!m) return false;
        this.delta(m, -1);
        this.modifiers.delete(m.id);
        return true;
    }

    private delta(m: Modifier, s: 1 | -1) {
        switch (m.type) {
            case ModifierType.Flat: this.flatSum += s * m.value; break;
            case ModifierType.Additive: this.addSum += s * m.value; break;      // % points
            case ModifierType.Multiplicative:
                if (s === 1) this.mulProd *= m.value; else this.mulProd /= m.value;
                break;
        }
        // aggregates stay consistent with incremental updates
    }

    public upkeep(now: number) {
        if (this.nextExpiry !== undefined && this.nextExpiry <= now) {
            print(now, this.nextExpiry);
            let newNext: number | undefined;
            const toDelete: string[] = [];
            this.modifiers.forEach((m, id) => {
                if (m.expireAt !== undefined && m.expireAt <= now) {
                    this.delta(m, -1);
                    toDelete.push(id);
                } else if (m.expireAt !== undefined) {
                    newNext = newNext === undefined ? m.expireAt : math.min(newNext, m.expireAt);
                }
            });
            toDelete.forEach((id) => this.modifiers.delete(id));
            this.nextExpiry = newNext;
            this.dirty = true;
        }

        if (!this.dirty) return;

        // Recompute aggregates (cheap, happens rarely)
        let flat = 0, add = 0, mul = 1;
        this.modifiers.forEach((m) => {
            switch (m.type) {
                case ModifierType.Flat: flat += m.value; break;
                case ModifierType.Additive: add += m.value; break;
                case ModifierType.Multiplicative: mul *= m.value; break;
            }
        });
        this.flatSum = flat;
        this.addSum = add;
        this.mulProd = mul;

        let nextt: number | undefined;
        this.modifiers.forEach((m) => {
            if (m.expireAt !== undefined) nextt = nextt === undefined ? m.expireAt : math.min(nextt, m.expireAt);
        });
        this.nextExpiry = nextt;

        this.dirty = false;
    }
}

export class ModifierContainer {
    public readonly id: string;
    private modifiers = new Map<ModifiableProperty, Bucket>();
    private idIndex = new Map<string, ModifiableProperty>();
    private parents: ModifierContainer[] = [];

    public constructor(
        parentId: string,
        salt: ModifierParent,
        parents?: ModifierContainer[]
    ) {
        this.id = salt + parentId;
        this.parents = parents ?? [];

        WorldTime.getInstance().on(TimeSignalType.Hour).connect(() => {
            this.sweepExpired();
        }, -10)
    }

    private getBucketFor(p: ModifiableProperty) {
        let b = this.modifiers.get(p);
        if (!b) { b = new Bucket(); this.modifiers.set(p, b); }
        return b;
    }

    public add(modifier: Modifier) {
        const prevProp = this.idIndex.get(modifier.id);
        if (prevProp && prevProp !== modifier.property) {
            this.modifiers.get(prevProp)?.remove(modifier.id);
        }

        this.getBucketFor(modifier.property).add(modifier);
        this.idIndex.set(modifier.id, modifier.property);

        this.replicate();
    }

    public remove(id: string) {
        const prop = this.idIndex.get(id);
        if (!prop) return;
        const b = this.modifiers.get(prop);
        if (!b) return;
        if (b.remove(id)) {
            this.idIndex.delete(id);
            this.replicate();
        }
    }

    public getEffectiveValue(base: number, properties: ModifiableProperty[]) {
        const now = WorldTime.getInstance().getTimestamp();

        let flatSum = 0;
        let addSum = 0;
        let mulProd = 1;

        const addFrom = (b?: Bucket) => {
            if (!b) return;
            b.upkeep(now);
            flatSum += b.flatSum;
            addSum += b.addSum;
            mulProd *= b.mulProd;
        };

        for (const prop of properties) {
            addFrom(this.modifiers.get(prop));
            for (const parent of this.parents) addFrom(parent.modifiers.get(prop));
        }

        let result = base + flatSum;
        result *= (1 + addSum / 100);
        result *= mulProd;
        return result;
    }

    public getAllModifiers(): Modifier[] {
        const now = WorldTime.getInstance().getTimestamp();
        const list: Modifier[] = [];
        this.modifiers.forEach((b) => {
            b.upkeep(now);
            b.modifiers.forEach((m) => list.push(m));
        });
        return list;
    }

    public getAllForProperty(property: ModifiableProperty): Modifier[] {
        const now = WorldTime.getInstance().getTimestamp();
        const b = this.modifiers.get(property);
        if (!b) return [];
        b.upkeep(now);
        const arr: Modifier[] = [];
        b.modifiers.forEach((m) => arr.push(m));
        return arr;
    }

    public hasModifier(id: string) {
        return this.idIndex.has(id);
    }

    public getParents() { return this.parents; }
    public setParents(parents: ModifierContainer[]) { this.parents = parents ?? []; }

    public sweepExpired() {
        const now = WorldTime.getInstance().getTimestamp();
        let changed = false;
        this.modifiers.forEach((b) => {
            const before = b.modifiers.size();
            b.upkeep(now);
            if (b.modifiers.size() !== before) changed = true;
        });
        if (changed) this.replicate();
    }

    private replicate() {
        ModifiersEmitter.client.emitAll(MessageType.ReplicateModifiers, {
            containerId: this.id,
            modifiers: this.getAllModifiers(),
            parentIds: this.parents.map((c) => c.id),
        } as MessageData[MessageType.ReplicateModifiers])
    }
}