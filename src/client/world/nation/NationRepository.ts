import {ReplicatedStorage} from "@rbxts/services";
import {Nation} from "./Nation";
import {NationReplicatorMessage, NationCreateMessage} from "../../../shared/network/nation/Replicator";
import {NationDTO} from "../../../shared/network/nation/DTO";

const replicator = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("NationReplicator") as RemoteEvent;
const stateRequestRemote = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("StateRequests")
    .WaitForChild("GetNationState") as RemoteFunction;

export class NationRepository {
    private nations = new Map<string, Nation>;

    private connection;

    private static instance: NationRepository;
    private constructor() {
        this.getGameState();
        this.connection = replicator.OnClientEvent.Connect((message: NationReplicatorMessage) => {
            if (message.type === "update") {
                this.handleUpdateEvent(message.payload)
            } else {
                error( `This type is not available.`)
            }
        })
    }

    private getGameState() {
        const message: NationCreateMessage = stateRequestRemote.InvokeServer();
        if (this.nations.size() > 0) error("Nations were already initialised.");

        this.handleCreateEvent(message.payload);
        print(`Loaded ${message.payload.size()} nations`);
    }

    // public methods
    public getById(id: string) {
        return this.nations.get(id);
    }

    // private methods
    private handleCreateEvent(payload: NationDTO[]) {
        const alliesToMap = new Map<string, string[]>;
        const enemiesToMap = new Map<string, string[]>;
        payload.forEach((data) => {
            if (data.allies.size() > 0) alliesToMap.set(data.id, data.allies);
            if (data.enemies.size() > 0) enemiesToMap.set(data.id, data.enemies);

            const nation = new Nation(data);
            this.nations.set(nation.getId(), nation);
        })

        this.nations.forEach((nation) => {
            const id = nation.getId();
            if (alliesToMap.has(id)) {
                const mappedAllies = alliesToMap.get(id)!.map((nationId) => {
                    const candidate = this.getById(nationId);
                    if (!candidate) error(`Failed to find nation ${nationId}`);
                    return candidate;
                })
                nation.setAllies(mappedAllies);
            }

            if (enemiesToMap.has(id)) {
                const mappedEnemies = enemiesToMap.get(id)!.map((nationId) => {
                    const candidate = this.getById(nationId);
                    if (!candidate) error(`Failed to find nation ${nationId}`);
                    return candidate;
                })
                nation.setEnemies(mappedEnemies);
            }
        })
    }

    private handleUpdateEvent(payload: Map<string, Partial<NationDTO>>) {
        payload.forEach((delta, id) => {
            const nation = this.nations.get(id);
            if (!nation) error(`Nation ${id} is not found!`);

            if (delta.color) {
                nation.setColor(delta.color);
            }

            if (delta.player) {
                nation.setPlayer(delta.player);
            }

            if (delta.flag) {
                nation.setFlag(delta.flag);
            }

            if (delta.allies) {
                nation.setAllies(delta.allies.map((nationId) => {
                    const candidate = this.getById(nationId);
                    if (!candidate) error(`Nation ${nationId} was not found!`);
                    return candidate;
                }));
            }

            if (delta.enemies) {
                nation.setEnemies(delta.enemies.map((nationId) => {
                    const candidate = this.getById(nationId);
                    if (!candidate) error(`Nation ${nationId} was not found!`);
                    return candidate;
                }));
            }

            if (delta.building) {
                nation.setBuildings(delta.building);
            }

            if (delta.resources) {
                nation.getResources().apply(delta.resources);
            }
        })
    }

    // singleton
    private clear() {
        this.connection.Disconnect()
    }

    public static resetInstance() {
        if (!this.instance) return;
        this.instance.clear();
        this.instance = undefined!;
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new NationRepository();
        }

        return this.instance;
    }
}

