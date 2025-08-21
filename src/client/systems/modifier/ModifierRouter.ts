import {ModifierContainer} from "./ModifierContainer";
import {MessageData, MessageType, ModifiersEmitter} from "../../../shared/tether/messages/Modifiers";

export class ModifierRouter {
    private static instance?: ModifierRouter;
    private constructor() {
        ModifiersEmitter.client.on(MessageType.ReplicateModifiers, (data: MessageData[MessageType.ReplicateModifiers]) => {
            print(data);
            this.processReplicateModifiers(data);
        })
    }

    private mirrors = new Map<string, ModifierContainer>();
    private pendingParentIds = new Map<string, string[]>();

    public ensure(containerId: string): ModifierContainer {
        let m = this.mirrors.get(containerId);
        if (!m) error(`Failed to find ${containerId}`);
        return m;
    }

    public register(containerId: string, mirror: ModifierContainer) {
        this.mirrors.set(containerId, mirror);
        const pending = this.pendingParentIds.get(containerId);
        if (pending) {
            this.bindParents(containerId, pending);
        }
    }

    public unregister(containerId: string) {
        this.mirrors.delete(containerId);
        this.pendingParentIds.delete(containerId);
    }

    public processReplicateModifiers(payload: MessageData[MessageType.ReplicateModifiers]) {
        const { containerId, modifiers, parentIds } = payload;

        const mirror = this.ensure(containerId);
        mirror.applyFull(modifiers);

        if (parentIds && parentIds.size() > 0) {
            this.pendingParentIds.set(containerId, parentIds);
            this.bindParents(containerId, parentIds);
        }
    }

    private bindParents(containerId: string, parentIds: string[]) {
        const child = this.mirrors.get(containerId);
        if (!child) return;

        const resolved: ModifierContainer[] = [];
        let allPresent = true;

        for (const pid of parentIds) {
            const p = this.mirrors.get(pid);
            if (!p) { allPresent = false; continue; }
            resolved.push(p);
        }

        if (resolved.size() > 0) {
            child.setParents(resolved);
        }

        // if all parents resolved, clear pending
        if (allPresent) this.pendingParentIds.delete(containerId);
    }

    private clean() {
        this.mirrors.clear();
        this.pendingParentIds.clear();
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new ModifierRouter();
        }

        return this.instance;
    }

    public static resetInstance() {
        if (!this.instance) return;
        this.instance.clean();
    }
}
