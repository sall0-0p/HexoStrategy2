import {ReplicatedStorage} from "@rbxts/services";
import {Nation} from "./Nation";
import {NationCreateMessage, NationUpdateMessage} from "../../../shared/dto/NationReplicatorMessage";
import {NationDTO} from "../../../shared/dto/NationDTO";

const replicator = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("NationReplicator") as RemoteEvent;

export class NationRepository {
    private nations = new Map<string, Nation>;

    private static instance: NationRepository;
    private constructor() {
        replicator.OnClientEvent.Connect((message: NationCreateMessage | NationUpdateMessage) => {
            if (message.type === "create") {
                if (this.nations.size() > 0) error("Nations were already initialised.");

                this.handleCreateEvent(message.payload);
                print(`Loaded ${message.payload.size()} nations`);
            } else if (message.type === "update") {
                print("Received update:", message);
                this.handleUpdateEvent(message.payload)
            } else {
                error(`This type is not available.`)
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
                const color = Color3.fromRGB(delta.color[0], delta.color[1], delta.color[2]);
                nation.setColor(color);
            }

            if (delta.player) {
                nation.setPlayer(delta.player);
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

