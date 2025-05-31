import {UnitMoveRequest, UnitOrderRequest, UnitOrderResponse} from "../../../shared/dto/UnitOrderRequest";
import {ReplicatedStorage} from "@rbxts/services";
import {UnitRepository} from "./UnitRepository";
import {HexRepository} from "../../world/hex/HexRepository";

const orderRequestRemote = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("UnitOrder") as RemoteFunction;

const unitRepository = UnitRepository.getInstance();
const hexRepository = HexRepository.getInstance();
export class UnitController {
    private static instance: UnitController;
    private constructor() {
        orderRequestRemote.OnServerInvoke = (player, body: unknown) => this.parseRequest(player, body as UnitOrderRequest);
    }

    private parseRequest(player: Player, request: UnitOrderRequest) {
        if (request.request === "move") {
            return this.moveRequest(request);
        }
    }

    private moveRequest(request: UnitMoveRequest) {
        const hex = hexRepository.getById(request.destination);
        if (!hex) {
            warn(`Invalid hexId ${request.destination}`)
            return { success: false } as UnitOrderResponse;
        }

        request.units.forEach((unitId) => {
            const unit = unitRepository.getById(unitId);
            if (!unit) {
                warn(`Invalid unitId ${unitId}. Aborting`);
                return { success: false } as UnitOrderResponse;
            }

            unit.moveTo(hex);
        })

        return { success: true } as UnitOrderResponse;
    }

    private haltRequest() {

    }

    private deleteRequest() {

    }

    // singleton shenanigans
    public static getInstance() {
        if (!this.instance) {
            this.instance = new UnitController();
        }

        return this.instance;
    }
}