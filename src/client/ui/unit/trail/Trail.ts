import {Hex} from "../../../world/hex/Hex";
import {Unit} from "../../../systems/unit/Unit";
import {Workspace} from "@rbxts/services";

const arrowParent = Workspace.WaitForChild("UI")
    .WaitForChild("UnitArrows") as Model;
const progressParent = Workspace.WaitForChild("UI")
    .WaitForChild("UnitProgressArrows") as Model;

interface TrailConnection {
    from: Hex,
    to: Hex,
    part: Part,
}

class TrailNode {
    public readonly hex: Hex;
    public part: Part;
    public connections: TrailConnection[] = [];
    private destroyed = false;

    constructor(hex: Hex) {
        const part = new Instance("Part");
        const position = hex.getModel().GetPivot().Position;
        part.Size = new Vector3(0.2, 0.2, 0.2);
        part.CFrame = new CFrame(position).mul(CFrame.Angles(0, 0, math.rad(90)));
        part.CanCollide = false;
        part.Anchored = true;
        part.Parent = arrowParent;
        part.Shape = Enum.PartType.Cylinder;

        this.hex = hex;
        this.part = part;
    }

    public connect(other: TrailNode) {
        if (this === other || this.destroyed || other.destroyed) return;
        if (this.connections.some(c => c.to.getId() === other.hex.getId())) return;

        const a = this.part.Position;
        const b = other.part.Position;
        const dir = b.sub(a);
        const length = dir.Magnitude;
        const midpoint = a.add(dir.mul(0.5));

        const link = new Instance("Part");
        link.Size = new Vector3(0.2, 0.2, length);

        link.CFrame = new CFrame(midpoint, b);
        link.Anchored = true;
        link.CanCollide = false;
        link.Material = this.part.Material;
        link.Color = this.part.Color;
        link.Parent = arrowParent;

        const conn: TrailConnection = { from: this.hex,    to: other.hex, part: link };
        const rev:  TrailConnection = { from: other.hex, to: this.hex, part: link };
        this.connections.push(conn);
        other.connections.push(rev);
    }

    public destroy() {
        if (this.destroyed) return;

        for (const { part } of this.connections) {
            part.Destroy();
        }
        this.connections = [];

        this.part.Destroy();
        this.destroyed = true;
    }
}

export class Trail {
    private path: Hex[];
    private nodes: TrailNode[] = [];
    private progress!: Part;
    private progressStart!: Part;
    private progressEnd!: Part;

    constructor(path: Hex[], current?: Hex) {
        this.path = path;
        this.buildNodes(path, current ?? path[0]);

        this.initProgressParts();
        this.updateProgress(0);
    }

    public update(path: Hex[], current: Hex) {
        this.buildNodes(path, current);
    }

    public updateProgress(progress: number) {
        const a = this.nodes[0]?.part.Position;
        const b = this.nodes[1]?.part.Position;
        if (!a || !b) return;

        const dir = b.sub(a);
        const t = math.clamp(progress * 0.01, 0, 1);
        const length = dir.Magnitude;
        const currentLength = length * t;
        const center = a.add(dir.mul(t * 0.5));

        this.progress.Size = new Vector3(0.2, 0.2, currentLength);
        this.progress.CFrame = new CFrame(center, center.add(dir));

        this.progressStart.CFrame = new CFrame(a).mul(CFrame.Angles(0, 0, math.rad(90)));

        const endPos = a.add(dir.Unit.mul(currentLength));
        this.progressEnd.CFrame = new CFrame(endPos).mul(CFrame.Angles(0, 0, math.rad(90)));
    }

    public destroy() {
        this.nodes.forEach((node) => node.destroy());
        this.progress.Destroy();
        this.progressStart.Destroy();
        this.progressEnd.Destroy();
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

                const prevNode = this.nodes[this.nodes.size() - 2];
                if (prevNode) {
                    prevNode.connect(this.nodes[this.nodes.size() - 1]);
                }
            }
        })
    }

    private initProgressParts() {
        const progress = new Instance("Part");
        progress.CanCollide = false;
        progress.Anchored = true;
        progress.Parent = progressParent;
        this.progress = progress;
        const progressStart = new Instance("Part");
        progressStart.Size = new Vector3(0.2, 0.2, 0.2);
        progressStart.CanCollide = false;
        progressStart.Anchored = true;
        progressStart.Parent = progressParent;
        progressStart.Shape = Enum.PartType.Cylinder;
        this.progressStart = progressStart;
        const progressEnd = new Instance("Part");
        progressEnd.Size = new Vector3(0.2, 0.2, 0.2);
        progressEnd.CanCollide = false;
        progressEnd.Anchored = true;
        progressEnd.Parent = progressParent;
        progressEnd.Shape = Enum.PartType.Cylinder;
        this.progressEnd = progressEnd;
    }
}