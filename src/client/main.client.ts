import {ReplicatedStorage} from "@rbxts/services";
import {HexRepository} from "./classes/hex/HexRepository";
import {NationRepository} from "./classes/nation/NationRepository";

const nationRepository = NationRepository.getInstance();
const hexRepository = HexRepository.getInstance();