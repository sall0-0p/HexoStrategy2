import {Hex} from "./Hex";
import {ReplicatedStorage} from "@rbxts/services";
import {HexDTO} from "../../../shared/networking/dto/HexDTO";
import {HexReplicatorMessage} from "../../../shared/networking/dto/HexReplicatorMessage";

const replicator = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("HexReplicator") as RemoteEvent;

export class HexRepository {
    private hexesById = new Map<string, Hex>;
    private hexesByCoords = new Map<string, Hex>;

    private static instance: HexRepository;
    private constructor() {
        replicator.OnClientEvent.Connect((message: HexReplicatorMessage) => {
            if (message.type === "full") {
                if (this.hexesById.size() > 0) error("Hexes were already initialised.");

                this.handleCreateEvent(message.payload);
                print(this.hexesById);
            } else if (message.type === "update") {
                this.handleUpdateEvent(message.payload)
            } else {
                error("This type is not available.")
            }
        })
    }

    private handleCreateEvent(payload: HexDTO[]) {
        payload.forEach((data) => {
            const hex = new Hex(data);
            const hexPosition = hex.getPosition();
            this.hexesById.set(hex.getId(), hex);
            this.hexesByCoords.set(`${hexPosition.q},${hexPosition.r},${hexPosition.s}`, hex);
        })
    }

    private handleUpdateEvent(payload: HexDTO[]) {

    }

    // singleton
    public static getInstance() {
        if (!this.instance) {
            this.instance = new HexRepository();
        }

        return this.instance;
    }
}

export const hexRepository = HexRepository.getInstance();