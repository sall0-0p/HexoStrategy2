import {nationRepository, NationRepository} from "./classes/nation/NationRepository";
import {hexRepository, HexRepository} from "./classes/hex/HexRepository";
import {NationReplicator} from "./classes/nation/NationReplicator";
import {HexReplicator} from "./classes/hex/HexReplicator";
import {Nation} from "./classes/nation/Nation";
import {UnitTemplate} from "./classes/unit/template/UnitTemplate";
import {TemplateRepository} from "./classes/unit/template/TemplateRepository";
import {UnitRepository} from "./classes/unit/UnitRepository";
import {Unit} from "./classes/unit/Unit";
import {UnitReplicator} from "./classes/unit/UnitReplicator";
NationRepository.getInstance();
NationReplicator.getInstance();
HexRepository.getInstance();
HexReplicator.getInstance();
TemplateRepository.getInstance();
UnitRepository.getInstance();
UnitReplicator.getInstance();

wait(3);
let ponylandia: Nation = nationRepository.getById("PNL")!;
hexRepository.getById("H1800")!.setOwner(ponylandia);
hexRepository.getById("H1799")!.setOwner(ponylandia);

let spawnHex = hexRepository.getById("H1800")!;
let template: UnitTemplate = new UnitTemplate("Infantry", 200, 60, 120, new Instance("Model"), "", ponylandia);
let unit: Unit = new Unit(template, spawnHex);

wait(5)
print("Moving unit!")
unit.setPosition(hexRepository.getById("H001")!);
wait(1)
print("Moving unit!")
unit.setPosition(hexRepository.getById("H002")!);
wait(1)
print("Moving unit!")
unit.setPosition(hexRepository.getById("H003")!);