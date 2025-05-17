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

wait(1);
let ponylandia: Nation = nationRepository.getById("PNL")!;
let byrdlands: Nation = nationRepository.getById("BRD")!;

let spawnHex1 = hexRepository.getById("H001")!;
let spawnHex2 = hexRepository.getById("H003")!;
let spawnHex3 = hexRepository.getById("H005")!;
let template1: UnitTemplate = new UnitTemplate("Infantry", 200, 60, 120, new Instance("Model"), "", ponylandia);
let template2: UnitTemplate = new UnitTemplate("Infantry", 200, 60, 120, new Instance("Model"), "", byrdlands);
let unit11: Unit = new Unit(template1, spawnHex1);
let unit12: Unit = new Unit(template1, spawnHex1);
let unit2: Unit = new Unit(template2, spawnHex2);

wait(1)

let counter = 0
while (true) {
    const neighbors = unit11.getPosition().getNeighbors()
    unit11.setPosition(neighbors[math.random(0, neighbors.size()-1)]);
    wait(1);
}