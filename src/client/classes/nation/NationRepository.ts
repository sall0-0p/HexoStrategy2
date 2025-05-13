import {ReplicatedStorage} from "@rbxts/services";
import {Nation} from "./Nation";
import {NationReplicatorMessage} from "../../../shared/networking/dto/NationReplicatorMessage";
import {NationDTO} from "../../../shared/networking/dto/NationDTO";

const replicator = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("NationReplicator") as RemoteEvent;

export class NationRepository {
    private nations = new Map<string, Nation>;

    private static instance: NationRepository;
    private constructor() {
        replicator.OnClientEvent.Connect((message: NationReplicatorMessage) => {
            if (message.type === "full") {
                if (this.nations.size() > 0) error("Nations were already initialised.");

                this.handleCreateEvent(message.payload);
                print(`Loaded ${message.payload.size()} nations`);
            } else if (message.type === "update") {
                this.handleUpdateEvent(message.payload)
            } else {
                error("This type is not available.")
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

    private handleUpdateEvent(payload: NationDTO[]) {

    }

    // singleton

    public static getInstance() {
        if (!this.instance) {
            this.instance = new NationRepository();
        }

        return this.instance;
    }
}

