import {Hex} from "./Hex";
import {ReplicatedStorage} from "@rbxts/services";
import {HexDTO} from "../../../shared/network/hex/DTO";
import {HexCreateMessage, HexUpdateMessage} from "../../../shared/network/hex/Replicator";
import {NationRepository} from "../nation/NationRepository";
import {Signal} from "../../../shared/classes/Signal";

const replicator = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("HexReplicator") as RemoteEvent;
const stateRequestRemote = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("StateRequests")
    .WaitForChild("GetHexState") as RemoteFunction;

export class HexRepository {
    private hexesById = new Map<string, Hex>;
    private hexesByCoords = new Map<string, Hex>;

    private loadedSignal = new Signal<[]>;

    private connection;
    private nationRepository = NationRepository.getInstance();

    private static instance: HexRepository;
    private constructor() {
        this.requestGameState();
        this.connection = replicator.OnClientEvent.Connect((message: HexCreateMessage | HexUpdateMessage) => {
            if (message.type === "update") {
                this.handleUpdateEvent(message.payload);
            } else {
                error("This template is not available.")
            }
        });
    }

    private requestGameState() {
        const message: HexCreateMessage = stateRequestRemote.InvokeServer();
        if (this.hexesById.size() > 0) error(`Hexes were already initialised. Message Source: ${message.source}`);

        this.handleCreateEvent(message.payload);
        print(`Loaded ${message.payload.size()} hexes from ${message.source}`);

        if (this.loadedSignal) {
            this.loadedSignal.complete();
            this.loadedSignal.fire();
        }
    }

    // public methods

    public getById(id: string) {
        return this.hexesById.get(id);
    }

    public getAll(): Hex[] {
        let result: Hex[] = [];

        this.hexesById.forEach((hex) => {
            result.push(hex);
        })

        return result;
    }

    public getLoadedSignal(): Signal<[]> {
        if (this.hexesById.size()) {
            warn("Hexes are already loaded, returned signal will not be fired.");
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
                const nation = this.nationRepository.getById(delta.owner);
                if (nation) hex.setOwner(nation);
            }
        })
    }

    // singleton
    private clear() {
        this.connection.Disconnect();
    }

    public static resetInstance() {
        if (!this.instance) return;
        this.instance.clear();
        this.instance = undefined!;
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new HexRepository();
        }

        return this.instance;
    }
}