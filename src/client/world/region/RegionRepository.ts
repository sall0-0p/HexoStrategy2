import {ReplicatedStorage} from "@rbxts/services";
import {Region} from "./Region";
import {RegionCreateMessage, RegionReplicatorMessage} from "../../../shared/network/region/Replicator";
import {RegionDTO} from "../../../shared/network/region/DTO";
import {NationRepository} from "../nation/NationRepository";

const replicator = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("RegionReplicator") as RemoteEvent;
const stateRequestRemote = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("StateRequests")
    .WaitForChild("GetRegionState") as RemoteFunction;

export class RegionRepository {
    private regions = new Map<string, Region>;

    private connection;
    private nationRepository = NationRepository.getInstance();
    private static instance: RegionRepository;
    private constructor() {
        this.getGameState();
        this.connection = replicator.OnClientEvent.Connect((message: RegionReplicatorMessage) => {
            if (message.type === "update") {
                this.handleUpdateEvent(message.payload);
            } else {
                error("Bad request!");
            }
        })
    }

    private getGameState() {
        const message: RegionCreateMessage = stateRequestRemote.InvokeServer();
        if (this.regions.size() > 0) error("Nations were already initialised!");

        this.handleCreateEvent(message.payload);
        print(`Loaded ${message.payload.size()} regions`);
    }

    // public methods
    public getById(id: string) {
        return this.regions.get(id);
    }

    // private methods
    private handleCreateEvent(payload: RegionDTO[]) {
        payload.forEach((data) => {
            const region = new Region(data);
            this.regions.set(region.getId(), region);
        })
    }

    private handleUpdateEvent(payload: Map<string, Partial<RegionDTO>>) {
        payload.forEach((delta, id) => {
            const region = this.regions.get(id);
            if (!region) error(`Region ${id} is not found!`);

            if (delta.owner) {
                const candidate = this.nationRepository.getById(delta.owner);
                if (!candidate) error(`Nation ${delta.owner} is not found!`);
                region.setOwner(candidate);
            }
        })
    }

    // singleton shenanigans
    private clear() {
        this.connection.Disconnect();
    }

    public static resetInstance() {
        if (!this.instance) return;
        this.instance.clear();
        this.instance = undefined!;
    }

    public static getInstance(): RegionRepository {
        if (!this.instance) {
            this.instance = new RegionRepository();
        }
        return this.instance;
    }
}