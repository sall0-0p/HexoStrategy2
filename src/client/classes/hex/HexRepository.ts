import {Hex} from "./Hex";
import {ReplicatedStorage} from "@rbxts/services";
import {HexDTO} from "../../../shared/dto/HexDTO";
import {HexCreateMessage, HexUpdateMessage} from "../../../shared/dto/HexReplicatorMessage";
import {NationRepository} from "../nation/NationRepository";
import {Signal} from "../../../shared/classes/Signal";

const nationRepository = NationRepository.getInstance();

const replicator = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("HexReplicator") as RemoteEvent;

export class HexRepository {
    private hexesById = new Map<string, Hex>;
    private hexesByCoords = new Map<string, Hex>;

    private loadedSignal?: Signal<[]>;

    private static instance: HexRepository;

    private constructor() {
        replicator.OnClientEvent.Connect((message: HexCreateMessage | HexUpdateMessage) => {
            if (message.type === "create") {
                if (this.hexesById.size() > 0) error("Hexes were already initialised.");

                this.handleCreateEvent(message.payload);
                print(`Loaded ${message.payload.size()} hexes from ${message.source}`);

                if (this.loadedSignal) {
                    this.loadedSignal.fire();
                }
            } else if (message.type === "update") {
                this.handleUpdateEvent(message.payload);
            } else {
                error("This type is not available.")
            }
        })
    }

    // public methods

    public getById(id: string) {
        return this.hexesById.get(id);
    }

    public getLoadedSignal(): Signal<[]> {
        if (this.hexesById.size()) {
            warn("Hexes are already loaded, returned signal will not be fired.");
        }

        if (!this.loadedSignal) {
            this.loadedSignal = new Signal<[]>();
        }
        return this.loadedSignal;
    }

    // private methods

    private handleCreateEvent(payload: HexDTO[]) {
        payload.forEach((data) => {
            const hex = new Hex(data);
            const hexPosition = hex.getPosition();
            this.hexesById.set(hex.getId(), hex);
            this.hexesByCoords.set(`${hexPosition.q},${hexPosition.r},${hexPosition.s}`, hex);
        })
    }

    private handleUpdateEvent(payload: Map<string, Partial<HexDTO>>) {
        payload.forEach((delta, id) => {
            const hex = this.hexesById.get(id);
            if (!hex) error(`Hex ${id} is not found!`);

            if (delta.owner) {
                const nation = nationRepository.getById(delta.owner);
                if (nation) hex.setOwner(nation);
            }
        })
    }

    // singleton
    public static getInstance() {
        if (!this.instance) {
            this.instance = new HexRepository();
        }

        return this.instance;
    }
}