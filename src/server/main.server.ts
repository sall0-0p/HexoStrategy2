import {nationRepository, NationRepository} from "./classes/nation/NationRepository";
import {hexRepository, HexRepository} from "./classes/hex/HexRepository";
import {NationReplicator} from "./classes/nation/NationReplicator";
import {HexReplicator} from "./classes/hex/HexReplicator";
import {Nation} from "./classes/nation/Nation";
NationRepository.getInstance();
NationReplicator.getInstance();
HexRepository.getInstance();
HexReplicator.getInstance();

wait(3);
let ponylandia: Nation = nationRepository.getById("PNL")!;
hexRepository.getById("H1800")!.setOwner(ponylandia);
hexRepository.getById("H1799")!.setOwner(ponylandia);