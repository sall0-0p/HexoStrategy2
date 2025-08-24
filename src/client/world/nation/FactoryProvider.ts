import {FactoryReservationType, FactorySourceType} from "../../../shared/constants/FactoryDef";
import {FactoryProviderEmitter, MessageData, MessageType} from "../../../shared/network/tether/messages/FactoryProvider";
import {Nation} from "./Nation";
import {Signal} from "../../../shared/classes/Signal";
import {ReplicatedStorage} from "@rbxts/services";

const replicator = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("FactoryProviderReplicator") as RemoteEvent;

export class FactoryProvider {
    private total = 0;
    private reserved = 0;
    private used = 0;
    private available = 0;
    private unallocated = 0;

    private sources: Map<FactorySourceType, number> = new Map();
    private reservations: Map<FactoryReservationType, number> = new Map();

    public readonly updated: Signal<[]> = new Signal();

    public constructor(private nation: Nation) {
        replicator.OnClientEvent.Connect((data: MessageData[MessageType.ReplicateUsed] | MessageData[MessageType.ReplicateFull]) => {
            if (data.type === "used") {
                this.processUsed(data as MessageData[MessageType.ReplicateUsed]);
            } else {
                this.processFull(data as MessageData[MessageType.ReplicateFull]);
            }
        })
    }

    public processFull(data: MessageData[MessageType.ReplicateFull]) {
        if (data.nationId !== this.nation.getId()) return;
        this.total = data.total;
        this.reserved = data.reserved;
        this.used = data.used;
        this.available = data.available;
        this.unallocated = data.unallocated;

        this.sources = data.sources;
        this.reservations = data.reservations;

        this.updated.fire();
    }

    public processUsed(data: MessageData[MessageType.ReplicateUsed]) {
        if (data.nationId !== this.nation.getId()) return;
        this.total = data.total;
        this.used = data.used;
        this.unallocated = math.max(0, this.available - this.used);

        this.updated.fire();
    }

    public getTotal() { return this.total; }
    public getReserved() { return this.reserved; }
    public getUsed() { return this.used; }
    public getAvailable() { return this.available; }
    public getUnallocated() { return this.unallocated; }

    public getSources(): ReadonlyMap<FactorySourceType, number> {
        return this.sources;
    }

    public getReservations(): ReadonlyMap<FactoryReservationType, number> {
        return this.reservations;
    }
}
