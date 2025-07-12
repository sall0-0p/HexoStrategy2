import {UnitTemplate} from "./template/UnitTemplate";
import {Hex} from "../../world/hex/Hex";
import {Unit} from "./Unit";
import {UnitRepository} from "./UnitRepository";
import {UnitReplicator} from "./UnitReplicator";
import {Order} from "./order/Order";
import {DiplomaticRelationStatus} from "../diplomacy/DiplomaticRelation";
import {MovementOrder} from "./order/MovementOrder";

export class UnitService {
    private repo = UnitRepository.getInstance();
    private replicator = UnitReplicator.getInstance();

    private static instance: UnitService
    private constructor() {}

    public create(template: UnitTemplate, position: Hex) {
        const unit = new Unit(template, position);
        this.repo.addUnit(unit);
        this.replicator.addToCreateQueue(unit);
        return unit;
    }

    public pushOrder(unit: Unit, order: Order) {
        unit.getOrderQueue().push(order);
    }

    public clearOrders(unit: Unit) {
        unit.getOrderQueue().clear();
    }

    public retreat(unit: Unit) {
        const position = unit.getPosition();
        const relations = unit.getOwner().getRelations();
        const candidate = position.getNeighbors().find((neighbour) => {
            const owner = neighbour.getOwner();
            if (!owner) return true;
            return relations.getRelationStatus(owner) === DiplomaticRelationStatus.Allied || owner === unit.getOwner();
        });

        if (candidate) {
            this.clearOrders(unit);
            this.pushOrder(unit, new MovementOrder(unit, candidate, true));
        } else {
            this.kill(unit);
        }
    }

    public kill(unit: Unit) {
        unit.getOrderQueue().clear();
        unit.die();
        this.delete(unit);
    }

    public delete(unit: Unit) {
        this.repo.deleteUnit(unit);
        this.replicator.addToDeletionQueue(unit);
    }

    // singleton shenanigans
    public static getInstance() {
        if (!this.instance) {
            this.instance = new UnitService();
        }

        return this.instance;
    }
}