import {BaseEquipmentType} from "../type/BaseEquipmentType";
import {Players, ReplicatedStorage} from "@rbxts/services";
import {EquipmentStockpile} from "./EquipmentStockpile";
import {
    MessageType,
    StockpileDeltaDTO,
    StockpileEntryDTO
} from "../../../../shared/network/stockpile/StockpileNetworking";
import {Connection} from "../../../../shared/classes/Signal";
import {TimeSignalType, WorldTime} from "../../time/WorldTime";

const replicator = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("StockpileReplicator") as RemoteEvent;

export class EquipmentStockpileReplicator {
    private dirtyTypes: Set<BaseEquipmentType> = new Set();
    private plrConnection: RBXScriptConnection;
    private hourConnection: Connection

    public constructor(private parent: EquipmentStockpile) {
        this.plrConnection = Players.PlayerAdded.Connect((p) => this.sendSnapshot(p));
        this.hourConnection = WorldTime.getInstance().on(TimeSignalType.Hour).connect(() => this.flush());
    }

    public sendDelta(types: BaseEquipmentType[]) {
        types.forEach((t) => this.dirtyTypes.add(t));
    }

    public sendSnapshot(player?: Player) {
        const entries: StockpileEntryDTO[] = [];

        this.parent.getStockpile().forEach((inner, archetype) => {
            inner.forEach((count, t) => {
                entries.push({
                    archetype,
                    typeId: t.getId(),
                    count,
                });
            });
        });

        if (entries.size() === 0) {
            return;
        }

        const message: StockpileDeltaDTO = {
            type: MessageType.StockpileDelta,
            target: this.parent.kind,
            targetId: this.parent.target.getId(),
            entries,
        };

        if (player) {
            replicator.FireClient(player, message);
        } else {
            replicator.FireAllClients(message);
        }
    }


    public flush() {
        if (this.dirtyTypes.size() === 0) return;

        const message: StockpileDeltaDTO = {
            type: MessageType.StockpileDelta,
            target: this.parent.kind,
            targetId: this.parent.target.getId(),
            entries: [],
        }

        const entries: StockpileEntryDTO[] = [];
        this.dirtyTypes.forEach((t) => {
            entries.push({
                archetype: t.getArchetype(),
                typeId: t.getId(),
                count: this.parent.getEquipmentCount(t),
            })
        })

        message.entries = entries;
        replicator.FireAllClients(message);
        this.dirtyTypes.clear();
    }

    public cleanup() {
        this.plrConnection.Disconnect();
        this.hourConnection.disconnect();
    }
}