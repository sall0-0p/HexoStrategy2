import {ReplicatedStorage, RunService} from "@rbxts/services";
import {BattleFlair} from "./BattleFlair";
import {BattleSummaryDTO} from "../../../../shared/network/battle/DTO";
import {UnitRepository} from "../../../systems/unit/UnitRepository";
import {HexRepository} from "../../../world/hex/HexRepository";

const replicator = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("BattleReplicator") as RemoteEvent;

export class BattleFlairManager {
    private flairs = new Map<string, BattleFlair>;

    private connection: RBXScriptConnection;
    private static instance: BattleFlairManager;
    private constructor() {
        RunService.BindToRenderStep("BattleFlairRendering", Enum.RenderPriority.Camera.Value - 1, () => this.onRender())
        this.connection = replicator.OnClientEvent.Connect((payload) => this.onUpdate(payload));
    }

    private onRender() {
        this.flairs.forEach((flair) => flair.render());
    }

    private onUpdate(payload: BattleSummaryDTO[]) {
        const battles = this.splitPayload(payload);

        battles.toAdd.forEach((data) =>
            this.addBattle(data));
        battles.toRemove.forEach((id) =>
            this.removeBattle(id));
        battles.toUpdate.forEach((data) =>
            this.updateBattle(data));
    }

    private addBattle(data: BattleSummaryDTO) {
        warn(`Adding ${data.id}`);
        if (this.flairs.has(data.id)) error("Attempting to add existing battle!");

        const attackingUnit = UnitRepository.getInstance().getById(data.attackers[0]);
        const attackingHex = attackingUnit?.getPosition();
        if (!attackingHex) error("Failed to determine attacking hex!");

        const defendingHex = HexRepository.getInstance().getById(data.location);
        if (!defendingHex) error("Failed to determine defending hex!");

        const flair = new BattleFlair(data.id, defendingHex, attackingHex!);
        this.flairs.set(data.id, flair);
    }

    private removeBattle(id: string) {
        this.flairs.get(id)?.destroy();
        this.flairs.delete(id);
    }

    private updateBattle(data: BattleSummaryDTO) {
        if (!this.flairs.has(data.id)) { warn("Trying to update non existing battle!"); return; }
        const attackingUnit = UnitRepository.getInstance().getById(data.attackers[0]);
        if (!attackingUnit) return;

        this.flairs.get(data.id)!.update(data, attackingUnit.getPosition());
    }

    private splitPayload(payload: BattleSummaryDTO[]): SplitPayload {
        const toAdd: BattleSummaryDTO[] = [];
        const toRemove: string[] = [];
        const toUpdate: BattleSummaryDTO[] = [];

        const incomingIds = new Set(payload.map(dto => dto.id));

        payload.forEach((dto) => {
            if (this.flairs.has(dto.id)) {
                toUpdate.push(dto);
            } else {
                toAdd.push(dto);
            }
        })

        this.flairs.forEach((_, id) => {
            if (!incomingIds.has(id)) {
                toRemove.push(id);
            }
        })

        return { toAdd, toRemove, toUpdate };
    }

    // singleton shenanigans
    private clear() {
        this.flairs.forEach((flair) => flair.destroy());
        RunService.UnbindFromRenderStep("BattleFlairRendering")
        this.connection.Disconnect();
    }

    public static resetInstance() {
        if (!this.instance) return;
        this.instance.clear();
        this.instance = undefined!;
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new BattleFlairManager();
        }

        return this.instance;
    }
}

interface SplitPayload {
    toAdd: BattleSummaryDTO[];
    toRemove: string[];
    toUpdate: BattleSummaryDTO[];
}