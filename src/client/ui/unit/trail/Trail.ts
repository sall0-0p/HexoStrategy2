import {Hex} from "../../../world/hex/Hex";
import {Unit} from "../../../systems/unit/Unit";
import {Workspace} from "@rbxts/services";

interface TrailConnection {
    from: Hex,
    to: Hex,
    part: Part,
}

class TrailNode {
    public readonly hex: Hex;
    private part: Part;
    public connections: TrailConnection[] = [];
    private destroyed = false;

    constructor(hex: Hex) {
        const part = new Instance("Part");
        part.Size = new Vector3(0.25, 0.25, 0.25);
        part.Position = hex.getModel().GetPivot().Position;
        part.Material = Enum.Material.Neon;
        part.Color = Color3.fromRGB(97, 191, 82);
        part.CanCollide = false;
        part.Anchored = true;
        part.Parent = Workspace;

        this.hex = hex;
        this.part = part;
    }

    public connect(node: TrailNode) {

    }

    public destroy() {
        if (this.destroyed) return;
        this.part.Destroy();
        this.destroyed = true;
    }
}

export class Trail {
    private path: Hex[];
    private nodes: TrailNode[] = [];

    constructor(path: Hex[], current?: Hex) {
        this.path = path;
        this.buildNodes(path, current ?? path[0]);
    }

    public update(path: Hex[], current: Hex) {
        this.buildNodes(path, current);
    }

    public updateProgress(progress: number) {

    }

    public destroy() {
        this.nodes.forEach((node) => node.destroy());
        this.nodes.clear();
    }

    private buildNodes(path: Hex[], current: Hex) {
        this.path = path
        const curIdx = path.findIndex(h => h.getId() === current.getId())
        const startIdx = curIdx >= 0 ? curIdx : 0

        const wantedIds = new Set<string>()
        path.forEach((hex, idx) => {
            if (idx >= startIdx) {
                wantedIds.add(hex.getId())
            }
        })

        this.nodes = this.nodes.filter(node => {
            const keep = wantedIds.has(node.hex.getId())
            if (!keep) node.destroy()
            return keep
        })

        const haveIds = new Set<string>()
        this.nodes.forEach(n => haveIds.add(n.hex.getId()))
        path.forEach((hex, idx) => {
            if (idx >= startIdx && !haveIds.has(hex.getId())) {
                this.nodes.push(new TrailNode(hex))
            }
        })
    }
}