import {nationRepository, NationRepository} from "./classes/nation/NationRepository";
import {hexRepository, HexRepository} from "./classes/hex/HexRepository";
import {HexReplicator} from "./classes/hex/HexReplicator";
import {Hex} from "./classes/hex/Hex";
import {Nation} from "./classes/nation/Nation";
import {NationReplicator} from "./classes/nation/NationReplicator";
NationRepository.getInstance();
NationReplicator.getInstance();
HexRepository.getInstance();
HexReplicator.getInstance();

print("Hello from server!");

wait(5)
print("Sending update!");
let hex: Hex = hexRepository.getById("H1291")!;
let ponylandia: Nation = nationRepository.getById("PNL")!;
hex.setOwner(ponylandia);