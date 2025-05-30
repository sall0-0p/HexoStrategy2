import {ReplicatedStorage} from "@rbxts/services";
import {Nation} from "./Nation";
import {
    NationCreateMessage,
    NationReplicatorMessage,
    NationUpdateMessage
} from "../../../shared/dto/NationReplicatorMessage";
import {NationDTO} from "../../../shared/dto/NationDTO";

const replicator = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("NationReplicator") as RemoteEvent;

export class NationRepository {
    private nations = new Map<string, Nation>;

    private static instance: NationRepository;
    private constructor() {
        replicator.OnClientEvent.Connect((message: NationReplicatorMessage) => {
            if (message.type === "create") {
                if (this.nations.size() > 0) error("Nations were already initialised.");

                this.handleCreateEvent(message.payload);
                print(`Loaded ${message.payload.size()} nations`);
            } else if (message.type === "update") {
                this.handleUpdateEvent(message.payload)
            } else {
                error( `This type is not available.`)
            }
        })
    }

    // public methods
    public getById(id: string) {
        return this.nations.get(id);
    }

    // private methods
    private handleCreateEvent(payload: NationDTO[]) {
        payload.forEach((data) => {
            const nation = new Nation(data);
            this.nations.set(nation.getId(), nation);
        })
    }

    private handleUpdateEvent(payload: Map<string, Partial<NationDTO>>) {
        payload.forEach((delta, id) => {
            const nation = this.nations.get(id);
            if (!nation) error(`Nation ${id} is not found!`);

            if (delta.color) {
                nation.setColor(delta.color);
            }

            if (delta.player) {
                nation.setPlayer(delta.player);
            }

            if (delta.flag) {
                nation.setFlag(delta.flag);
            }
        })
    }

    // singleton

    public static getInstance() {
        if (!this.instance) {
            this.instance = new NationRepository();
        }

        return this.instance;
    }
}

