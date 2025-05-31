import {Players, ReplicatedStorage, RunService} from "@rbxts/services";
import {RegionDTO} from "../../../shared/dto/RegionDTO";
import {Region} from "./Region";
import {RegionRepository} from "./RegionRepository";
import {RegionCreateMessage, RegionUpdateMessage} from "../../../shared/dto/RegionReplicatorMessage";

const replicator = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("RegionReplicator") as RemoteEvent;
const stateRequestRemote = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("StateRequests")
    .WaitForChild("GetRegionState") as RemoteFunction;

export class RegionReplicator {
    private dirtyRegions = new Map<string, Partial<RegionDTO>>;
    private regionRepository: RegionRepository;

    private static instance: RegionReplicator;
    private constructor(regionRepository: RegionRepository) {
        this.regionRepository = regionRepository;

        stateRequestRemote.OnServerInvoke = (player) => {
            return this.sendRegionsToPlayer(player);
        }

        RunService.Heartbeat.Connect(() => this.broadcastUpdates());
    }

    public markAsDirty(region: Region, delta: Partial<RegionDTO>) {
        if (!this.dirtyRegions.has(region.getId())) {
            this.dirtyRegions.set(region.getId(), delta);
        } else {
            const regionDelta = this.dirtyRegions.get(region.getId());
            this.dirtyRegions.set(region.getId(), {
                ...regionDelta,
                ...delta,
            })
        }
    }

    private sendRegionsToPlayer(player: Player) {
        const payload: RegionDTO[] = this.regionRepository.getAll()
            .map((region) => {
                return region.toDTO();
            });

        return {
            source: "playerAdded",
            type: "create",
            payload: payload,
        } as RegionCreateMessage;
    }

    private broadcastRegionsToEveryone() {
        const payload: RegionDTO[] = this.regionRepository.getAll()
            .map((region: Region) => {
                return region.toDTO()
            })

        replicator.FireAllClients({
            source: "start",
            type: "create",
            payload: payload,
        } as RegionCreateMessage);
    }

    private broadcastUpdates() {
        if (this.dirtyRegions.size() === 0) return;
        replicator.FireAllClients({
            type: "update",
            payload: this.dirtyRegions,
        } as RegionUpdateMessage)

        this.dirtyRegions.clear();
    }

    public static getInstance(regionRepository?: RegionRepository): RegionReplicator | undefined {
        if (!this.instance) {
            if (regionRepository) {
                this.instance = new RegionReplicator(regionRepository);
            }
        }

        return this.instance;
    }
}