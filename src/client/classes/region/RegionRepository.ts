import {ReplicatedStorage} from "@rbxts/services";
import {Region} from "./Region";
import {RegionReplicatorMessage} from "../../../shared/dto/RegionReplicatorMessage";
import {RegionDTO} from "../../../shared/dto/RegionDTO";
import {NationRepository} from "../nation/NationRepository";

const replicator = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("RegionReplicator") as RemoteEvent;

const nationRepository = NationRepository.getInstance();
export class RegionRepository {
    private regions = new Map<string, Region>;

    private static instance: RegionRepository;
    private constructor() {
        replicator.OnClientEvent.Connect((message: RegionReplicatorMessage) => {
            if (message.type === "create") {
                if (this.regions.size() > 0) error("Nations were already initialised!");

                this.handleCreateEvent(message.payload);
                print(`Loaded ${message.payload.size()} nations`);
            } else if (message.type === "update") {
                this.handleUpdateEvent(message.payload);
            } else {
                error("Bad request!");
            }
        })
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
                const candidate = nationRepository.getById(delta.owner);
                if (!candidate) error(`Nation ${delta.owner} is not found!`);
                region.setOwner(candidate);
            }
        })
    }

    // singleton shenanigans
    public static getInstance(): RegionRepository {
        if (!this.instance) {
            this.instance = new RegionRepository();
        }
        return this.instance;
    }
}