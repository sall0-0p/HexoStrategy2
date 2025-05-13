import {ReplicatedStorage} from "@rbxts/services";
import {HexRepository} from "./classes/hex/HexRepository";
import {NationRepository} from "./classes/nation/NationRepository";

const nationRepository = NationRepository.getInstance();
const hexRepository = HexRepository.getInstance();
hexRepository.getLoadedSignal().wait()
hexRepository.getById("H1291")!.getChangedSignal().connect((property, value) => {
    print(`Property ${property} changed to`, value, `for H1291`);
});