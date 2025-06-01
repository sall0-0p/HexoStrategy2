
import {Players, ReplicatedStorage} from "@rbxts/services";
import {NationRepository} from "./NationRepository";
import {Nation} from "./Nation";

const selectNationRequest = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("SelectNation") as RemoteFunction;

export class NationPicker {
    private playedNations = new Map<Player, Nation>;

    private nationRepository = NationRepository.getInstance();
    private static instance: NationPicker;
    private constructor() {
        Players.PlayerRemoving.Connect((player) => this.unassignPlayer(player));
        selectNationRequest.OnServerInvoke = (player, nationId) => this.assignPlayer(player, nationId as string);
    }

    private assignPlayer(player: Player, nationId: string) {
        this.unassignPlayer(player);
        const nation = this.nationRepository.getById(nationId);
        if (!nation) {
            warn(`Wrong nation id ${nationId} from player ${player.DisplayName}`);
            return false;
        }
        if (nation.getPlayer()) {
            warn(`Nation ${nationId} is already taken by ${nation.getPlayer()?.DisplayName}`);
            return false;
        }

        nation.setPlayer(player);
        this.playedNations.set(player, nation);
        return true;
    }

    private unassignPlayer(player: Player) {
        const nation = this.playedNations.get(player);
        if (!nation) return;
        nation.setPlayer(undefined);
        this.playedNations.delete(player);
    }

    // singleton shenanigans
    public static getInstance() {
        if (!this.instance) {
            this.instance = new NationPicker();
        }

        return this.instance;
    }
}