import {Hex} from "../../../world/hex/Hex";
import {Unit} from "../Unit";
import {DiplomaticRelationStatus} from "../../diplomacy/DiplomaticRelation";

export namespace MovementPathfinder {
    export function findPath(unit: Unit, start: Hex, goal: Hex): Hex[] | undefined {
        const openSet = new Set<Hex>();
        openSet.add(start);

        const cameFrom = new Map<Hex, Hex>();

        const gScore = new Map<Hex, number>();
        gScore.set(start, 0);

        const fScore = new Map<Hex, number>();
        fScore.set(start, heuristicCost(start, goal));

        while (openSet.size() > 0) {
            let current: Hex | undefined = undefined;
            let bestF = math.huge;
            openSet.forEach((h) => {
                const score = fScore.get(h) ?? math.huge;
                if (score < bestF) {
                    bestF = score;
                    current = h;
                }
            })
            if (current === undefined) break;
            let currentDef = current as Hex;

            if (currentDef === goal) {
                return reconstructPath(cameFrom, current);
            }

            openSet.delete(current);

            currentDef.getNeighbors().forEach((neighbor) => {
                if (!isTraversable(unit, currentDef, neighbor)) {
                    return;
                }

                const tentativeG = (gScore.get(currentDef) ?? math.huge) + movementCost(unit, currentDef, neighbor);

                const prevG = gScore.get(neighbor) ?? math.huge;
                if (tentativeG < prevG) {
                    cameFrom.set(neighbor, currentDef);
                    gScore.set(neighbor, tentativeG);
                    fScore.set(neighbor, tentativeG + heuristicCost(neighbor, goal));
                    if (!openSet.has(neighbor)) {
                        openSet.add(neighbor);
                    }
                }
            })
        }
        return undefined;
    }

    function heuristicCost(a: Hex, b: Hex) {
        // const hexDistance = a.getPosition().distance(b.getPosition());
        const physicalDistance = math.abs((a.getModel().GetPivot().Position.sub(b.getModel().GetPivot().Position)).Magnitude);
        return physicalDistance;
    }

    function movementCost(unit: Unit, from: Hex, to: Hex) {
        if (to.getOwner()?.getId() !== unit.getOwner().getId()) return 1.25;
        return 1;
    }

    function isTraversable(unit: Unit, from: Hex, to: Hex) {
        const hexOwner = to.getOwner();
        const unitOwner = unit.getOwner();

        if (hexOwner) {
            if (hexOwner.getId() === unitOwner.getId()) return true;

            const unitOwnerRelations = unitOwner.getRelations();
            const relations = unitOwnerRelations.get(hexOwner.getId());

            return (relations &&
                (relations.status === DiplomaticRelationStatus.Allied ||
                    relations.status  === DiplomaticRelationStatus.Enemy)
            )
        } else {
            // Check if water or whatever.
            return true;
        }
    }

    function reconstructPath(cameFrom: Map<Hex, Hex>, current: Hex) {
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