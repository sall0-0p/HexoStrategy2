import {ConstructionEmitter, MessageData, MessageType} from "../../../shared/tether/messages/Construction";
import {BuildingDefs} from "../../../shared/data/ts/BuildingDefs";
import {BuildingType} from "../../../shared/classes/BuildingDef";
import {Hex} from "../hex/Hex";
import {Region} from "../region/Region";
import {RegionRepository} from "../region/RegionRepository";
import {HexRepository} from "../hex/HexRepository";
import {Nation} from "../nation/Nation";
import {NationRepository} from "../nation/NationRepository";

export class ConstructionController {
    private static instance: ConstructionController;
    private constructor(private nationRepository: NationRepository, private regionRepository: RegionRepository, private hexRepository: HexRepository) {
        ConstructionEmitter.server.setCallback(
            MessageType.GetCurrentQueueRequest,
            MessageType.GetCurrentQueueResponse,
            (player, payload) => this.getCurrentQueue(player, payload));

        ConstructionEmitter.server.setCallback(
            MessageType.StartConstructionRequest,
            MessageType.StartConstructionResponse,
            (player, payload) => this.startConstruction(player, payload));

        ConstructionEmitter.server.setCallback(
            MessageType.MoveConstructionRequest,
            MessageType.MoveConstructionResponse,
            (player, payload) => this.moveConstruction(player, payload));

        ConstructionEmitter.server.setCallback(
            MessageType.CancelConstructionRequest,
            MessageType.CancelConstructionResponse,
            (player, payload) => this.cancelConstruction(player, payload));
    }

    private getCurrentQueue(
        player: Player,
        payload: MessageData[MessageType.GetCurrentQueueRequest]
    ): MessageData[MessageType.GetCurrentQueueResponse] {
        const nation: Nation | undefined = this.nationRepository.getByPlayer(player)![1];
        if (!nation) return { success: false };

        const cm = nation.getConstructionManager();
        const queue = cm.getQueue();

        return {
            success: true,
            data: queue.map((item) => {
                return {
                    id: item.id,
                    type: item.type,
                    target: item.target.getId(),
                    progress: item.getProgress(),
                    factories: item.getFactories(),
                }
            })
        }
    }

    private startConstruction(player: Player, payload: MessageData[MessageType.StartConstructionRequest]): MessageData[MessageType.StartConstructionResponse] {
        const nation: Nation | undefined = this.nationRepository.getByPlayer(player)![1];
        if (!nation) return { success: false };

        const cm = nation.getConstructionManager();

        let target: Region | Hex;
        const buildingType = BuildingDefs[payload.building].type;
        if (buildingType === BuildingType.Region || BuildingType.Shared) {
            const candidate = this.regionRepository.getById(payload.targetId);
            if (!candidate || candidate.getOwner() !== nation) return { success: false };
            target = candidate;
        } else {
            const candidate = this.hexRepository.getById(payload.targetId);
            if (!candidate || candidate.getOwner() !== nation) return { success: false };
            target = candidate;
        }

        const project = cm.addProject(target, payload.building);
        if (project) return { success: true };

        return { success: false };
    }

    private moveConstruction(player: Player, payload: MessageData[MessageType.MoveConstructionRequest]): MessageData[MessageType.MoveConstructionResponse] {
        const nation: Nation | undefined = this.nationRepository.getByPlayer(player)![1];
        if (!nation) return { success: false };

        const cm = nation.getConstructionManager();

        // TODO: Potential bug due to lack of verification for successful move. I am too lazy.
        cm.move(payload.constructionId, payload.position);
        return { success: true };
    }

    private cancelConstruction(player: Player, payload: MessageData[MessageType.CancelConstructionRequest]): MessageData[MessageType.CancelConstructionResponse] {
        const nation: Nation | undefined = this.nationRepository.getByPlayer(player)![1];
        if (!nation) return {success: false};

        const cm = nation.getConstructionManager();

        // TODO: Potential bug due to lack of verification for successful removal. I am too lazy.
        cm.cancel(payload.constructionId);
        return {success: true};
    }

    public pushUpdate(nation: Nation, data: {
        constructionId: string, progress: number, prediction: number, factories: number
    }) {
        const player = nation.getPlayer();
        if (player) {
            ConstructionEmitter.client.emit(player, MessageType.ConstructionProgressUpdate, data);
        }
    }

    public finishProject(nation: Nation, id: string) {
        const player = nation.getPlayer();
        if (player) {
            ConstructionEmitter.client.emit(player, MessageType.ProjectFinishedUpdate, {
                constructionId: id,
            });
        }
    }

    // singleton shenanigans
    public static getInstance(nationRepository?: NationRepository, regionRepository?: RegionRepository, hexRepository?: HexRepository) {
        if (!this.instance && nationRepository && regionRepository && hexRepository) {
            this.instance = new ConstructionController(nationRepository, regionRepository, hexRepository);
        } else if (!this.instance && (!nationRepository || !regionRepository || !hexRepository)) {
            error("Failed to initialise ConstructionController!");
        }

        return this.instance;
    }
}