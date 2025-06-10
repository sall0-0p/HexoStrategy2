import {Unit} from "../../../systems/unit/Unit";
import {Trail} from "./Trail";
import {ReplicatedStorage, Workspace} from "@rbxts/services";
import {
    MovementEndedMessage, MovementProgressMessage,
    MovementStartedMessage, MovementSubscriptionMessage,
    MovementUpdateMessage, SubscribeRequest, SubscribeResponse, UnsubscribeRequest
} from "../../../../shared/dto/MovementDataSubscription";
import {HexRepository} from "../../../world/hex/HexRepository";
import {Hex} from "../../../world/hex/Hex";
import {UnitRepository} from "../../../systems/unit/UnitRepository";

const subscriber = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("PathSubscriber") as RemoteFunction;
const unsubscriber = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("PathUnsubscriber") as RemoteFunction;
const subscriptionMessenger = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("PathSubscriptionEvent") as RemoteEvent;

export class TrailManager {
    private trails = new Map<Unit, Trail>;
    private subscribedUnits = new Set<Unit>;

    private hexRepository = HexRepository.getInstance();
    private unitRepository = UnitRepository.getInstance();
    private connection;
    private static instance: TrailManager;
    private constructor() {
        this.connection = subscriptionMessenger.OnClientEvent.Connect((payload) => this.onMessage(payload));
    }

    private onMessage(message: MovementSubscriptionMessage) {
        if (message.type === "started") {
            this.onStartMessage(message);
        } else if (message.type === "update") {
            this.onUpdateMessage(message);
        } else if (message.type === "progress") {
            this.onProgressMessage(message);
        } else if (message.type === "end") {
            this.onFinishedMessage(message);
        }
    }

    public onSelect(units: Unit[]) {
        this.subscribe(units);
    }

    public onDeselect(units: Unit[]) {
        this.unsubscribe(units);
    }

    private subscribe(units: Unit[]) {
        if (units.size() === 0) return;
        const payload: string[] = [];
        units.forEach((unit) => {
            this.subscribedUnits.add(unit);
            payload.push(unit.getId());
        })

        const response: SubscribeResponse = subscriber.InvokeServer({ units: payload } as SubscribeRequest);
        const responsePayload = response.payload;
        responsePayload.forEach((data, unitId) => {
            this.addTrail(this.queryUnit(unitId), this.queryPath(data.path), this.queryHex(data.current));
        })
    }

    private unsubscribe(units: Unit[]) {
        if (units.size() === 0) return;
        const payload: string[] = [];
        units.forEach((unit) => {
            this.subscribedUnits.delete(unit);
            payload.push(unit.getId());
        })

        unsubscriber.InvokeServer({ units: payload } as UnsubscribeRequest);
        units.forEach((unit) => {
            this.trails.get(unit)?.destroy();
            this.trails.delete(unit);
        })
    }

    private onStartMessage(message: MovementStartedMessage) {
        const payload = message.payload;
        payload.forEach((data, unitId) => {
            const path = this.queryPath(data.path);
            this.addTrail(this.queryUnit(unitId), path, path[0]);
        })
    }

    private onUpdateMessage(message: MovementUpdateMessage) {
        const payload = message.payload;
        payload.forEach((data, unitId) => {
            const unit = this.queryUnit(unitId);
            const trail = this.trails.get(unit);
            trail?.update(this.queryPath(data.path), this.queryHex(data.current));
        })
    }

    private onProgressMessage(message: MovementProgressMessage) {
        const payload = message.payload;
        payload.forEach((data, unitId) => {
            if (!data.progress) return;
            const unit = this.queryUnit(unitId);
            const trail = this.trails.get(unit);
            trail?.updateProgress(data.progress);
        })
    }

    private onFinishedMessage(message: MovementEndedMessage) {
        const payload = message.payload;
        payload.forEach((unitId) => {
            const unit = this.queryUnit(unitId);
            this.trails.get(unit)?.destroy();
            this.trails.delete(unit);
        })
    }

    private addTrail(unit: Unit, path: Hex[], current: Hex) {
        if (this.trails.has(unit)) {
            warn(`Trail already exists for unit ${unit.getId()}!`);
            this.trails.get(unit)?.destroy();
            this.trails.delete(unit);
        }

        const trail = new Trail(path, current);
        this.trails.set(unit, trail);
    }

    private queryPath(path: string[]): Hex[] {
        const result: Hex[] = [];
        path.forEach((hexId) => {
            result.push(this.queryHex(hexId));
        })
        return result;
    }

    private queryUnit(unitId: string) {
        const candidate = this.unitRepository.getById(unitId);
        if (!candidate) error(`Failed to find unit ${unitId}.`);
        return candidate;
    }

    private queryHex(hexId: string) {
        const candidate = this.hexRepository.getById(hexId);
        if (!candidate) error(`Hex with id ${hexId} was not found!`);
        return candidate;
    }

    // singleton shenanigans
    private clear() {
        this.trails.forEach((trail) => trail.destroy());
        this.trails.clear();
        this.connection.Disconnect();
    };

    public static resetInstance() {
        if (!this.instance) return;
        this.instance.clear();
        this.instance = undefined!;
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new TrailManager();
        }
        return this.instance;
    }
}