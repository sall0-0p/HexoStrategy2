import {ReplicatedStorage} from "@rbxts/services";
import {HexDTO} from "../shared/networking/dto/HexDTO";

const event = ReplicatedStorage
    .WaitForChild("Events")
    .WaitForChild("HexReplicator", 10) as RemoteEvent;

event.OnClientEvent.Connect((hexes: HexDTO[]) => {
    print(hexes);
    print(hexes.size());
})