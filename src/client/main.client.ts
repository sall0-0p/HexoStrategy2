import {ReplicatedStorage} from "@rbxts/services";
import {HexRepository} from "./classes/hex/HexRepository";
import {NationRepository} from "./classes/nation/NationRepository";
import {HeatmapManager} from "./classes/heatmap/HeatmapManager";
import {NationHeatmap} from "./classes/heatmap/heatmaps/NationHeatmap";
import {UnitReplicatorMessage} from "../shared/dto/UnitReplicatorMessage";
import {UnitRepository} from "./classes/unit/UnitRepository";
import {UnitFlairManager} from "./classes/unit/render/UnitFlairManager";

const nationRepository = NationRepository.getInstance();
const hexRepository = HexRepository.getInstance();
const unitRepository = UnitRepository.getInstance();
const unitFlairManager = UnitFlairManager.getInstance();
hexRepository.getLoadedSignal().wait();
const heatmapManager = HeatmapManager.getInstance();
heatmapManager.showHeatmap(new NationHeatmap());

const event = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("UnitReplicator") as RemoteEvent;

event.OnClientEvent.Connect((event: UnitReplicatorMessage) => {
    print(event);
})

wait(10)
print("all units:")
print(UnitRepository.getInstance().getAll())