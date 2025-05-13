import {ReplicatedStorage} from "@rbxts/services";
import {HexDTO} from "../shared/networking/dto/HexDTO";
import {HexRepository} from "./classes/hex/HexRepository";

const event = ReplicatedStorage
    .WaitForChild("Events")
    .WaitForChild("HexReplicator", 10) as RemoteEvent;

HexRepository.getInstance();