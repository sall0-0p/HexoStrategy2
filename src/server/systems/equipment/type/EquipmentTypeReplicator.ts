import {
    EquipmentEmitter,
    EquipmentTypeDTO,
    MessageData,
    MessageType
} from "../../../../shared/network/tether/messages/EquipmentEmitter";
import {EquipmentTypeRepository} from "./EquipmentTypeRepository";
import {BaseEquipmentType} from "./BaseEquipmentType";
import {TimeSignalType, WorldTime} from "../../time/WorldTime";
import {Players, ReplicatedStorage} from "@rbxts/services";

const replicator = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("EquipmentTypeReplicator") as RemoteEvent;

export class EquipmentTypeReplicator {
    private addBatch: EquipmentTypeDTO[] = [];
    private updateBatch: EquipmentTypeDTO[] = [];

    public constructor(private repository: EquipmentTypeRepository) {
        WorldTime.getInstance().on(TimeSignalType.Hour).connect(() => this.flush());
        Players.PlayerAdded.Connect((plr) => this.replicateAllToPlayer(plr));
    }

    public replicateAdd(t: BaseEquipmentType) {
        this.addBatch.push(t.toDTO());
    }

    public replicateUpdate(t: BaseEquipmentType) {
        this.updateBatch.push(t.toDTO());
    }

    public replicateAllToPlayer(player: Player) {
        const types: EquipmentTypeDTO[] = this.repository.getAll()
            .map((t): EquipmentTypeDTO => t.toDTO());

        replicator.FireClient(player, {
            message: MessageType.AddEquipment,
            types,
        } as MessageData[MessageType.AddEquipment])
    }

    private flush() {
        this.flushAdd();
        this.flushUpdate();
    }

    private flushAdd() {
        if (this.addBatch.size() > 0) {
            replicator.FireAllClients({
                message: MessageType.AddEquipment,
                types: this.addBatch,
            } as MessageData[MessageType.AddEquipment])
            this.addBatch.clear();
        }
    }

    private flushUpdate() {
        if (this.updateBatch.size() > 0) {
            // EquipmentEmitter.client.emitAll(MessageType.UpdateEquipment, {
            //     types: this.updateBatch,
            // })
            replicator.FireAllClients({
                message: MessageType.UpdateEquipment,
                types: this.updateBatch,
            } as MessageData[MessageType.UpdateEquipment])
            this.updateBatch.clear();
        }
    }
}