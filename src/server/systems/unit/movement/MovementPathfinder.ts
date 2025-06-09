import { Hex } from "../../../world/hex/Hex";
import { DiplomaticRelationStatus } from "../../diplomacy/DiplomaticRelation";
import { Unit } from "../Unit";

export namespace MovementPathfinder {
    export function findPath(unit: Unit, start: Hex, goal: Hex): Hex[] | undefined {
        const openSet = new Set<Hex>();
        openSet.add(start);

        const cameFrom = new Map<Hex, Hex>();
        const gScore = new Map<Hex, number>([[start, 0]]);
        const fScore = new Map<Hex, number>([[start, heuristicCost(start, goal)]]);

        while (openSet.size() > 0) {
            let current: Hex | undefined;
            let best = math.huge;
            openSet.forEach(h => {
                const f = fScore.get(h) ?? math.huge;
                if (f < best) { best = f; current = h; }
            });
            if (!current) break;

            if (current === goal) {
                return reconstructPath(cameFrom, current);
            }

            openSet.delete(current);

            current.getNeighbors().forEach(neighbor => {
                if (!isTraversable(unit, current!, neighbor)) return;

                const tentative = (gScore.get(current!) ?? math.huge) + movementCost(unit, current!, neighbor);
                const prev = gScore.get(neighbor) ?? math.huge;
                if (tentative < prev) {
                    cameFrom.set(neighbor, current!);
                    gScore.set(neighbor, tentative);
                    fScore.set(neighbor, tentative + heuristicCost(neighbor, goal));
                    if (!openSet.has(neighbor)) openSet.add(neighbor);
                }
            });
        }
        return undefined;
    }

    function heuristicCost(a: Hex, b: Hex): number {
        return a.getModel().GetPivot().Position.sub(b.getModel().GetPivot().Position).Magnitude;
    }

    function movementCost(unit: Unit, from: Hex, to: Hex): number {
        return to.getOwner()?.getId() !== unit.getOwner().getId() ? 1.25 : 1;
    }

    function isTraversable(unit: Unit, from: Hex, to: Hex): boolean {
        const owner = to.getOwner();
        if (!owner) return true;
        if (owner.getId() === unit.getOwner().getId()) return true;
        const rel = unit.getOwner().getRelations().get(owner.getId());
        return rel !== undefined && (rel.status === DiplomaticRelationStatus.Allied || rel.status === DiplomaticRelationStatus.Enemy);
    }

    function reconstructPath(cameFrom: Map<Hex, Hex>, current: Hex): Hex[] {
        const totalPath: Hex[] = [current];
        let curr = current;
        while (cameFrom.has(curr)) {
            curr = cameFrom.get(curr)!;
            totalPath.push(curr);
        }
        const path: Hex[] = [];
        for (let i = totalPath.size() - 2; i >= 0; i--) {
            path.push(totalPath[i]);
        }

        return path;
    }
}
