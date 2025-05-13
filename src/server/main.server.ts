import {nationRepository, NationRepository} from "./classes/nation/NationRepository";
import {hexRepository, HexRepository} from "./classes/hex/HexRepository";
import {NationReplicator} from "./classes/nation/NationReplicator";
import {HexReplicator} from "./classes/hex/HexReplicator";
import {Nation} from "./classes/nation/Nation";
NationRepository.getInstance();
NationReplicator.getInstance();
HexRepository.getInstance();
HexReplicator.getInstance();

print("Hello from server!");

wait(2)
print("Sending update!");
let ponylandia: Nation = nationRepository.getById("PNL")!;
hexRepository.getById("H1291")!.setOwner(ponylandia);
ponylandia.setColor(Color3.fromRGB(255, 255, 255));