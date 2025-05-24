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
import {MovementTicker} from "./classes/unit/MovementTicker";
import {Hex} from "./classes/hex/Hex";
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
let fungaria: Nation = nationRepository.getById("FNG")!;

let spawnHex1 = hexRepository.getById("H001")!;
let spawnHex2 = hexRepository.getById("H1800")!;
let spawnHex3 = hexRepository.getById("H003")!;
let template1: UnitTemplate = new UnitTemplate("Infantry", 200, 60, 4, 120, new Instance("Model"), "", ponylandia);
let template2: UnitTemplate = new UnitTemplate("Infantry", 200, 60, 4, 120, new Instance("Model"), "", byrdlands);
let template3: UnitTemplate = new UnitTemplate("Infantry", 200, 60, 4, 120, new Instance("Model"), "", fungaria);
// let unit11: Unit = new Unit(template1, spawnHex1);
// wait(1)
//
// while (true) {
//
//     wait(1);
// }

function moveToEnemyHex(unit: Unit) {
    if (math.random(1, 4) > 1) return;
    const neighbors = unit.getPosition().getNeighbors();
    const alliedHexes: Hex[] = [];
    const enemyHexes: Hex[] = [];

    neighbors.forEach((hex) => {
        if (hex.getOwner()?.getId() === unit.getOwner().getId()) {
            alliedHexes.push(hex);
        } else {
            enemyHexes.push(hex);
        }
    })

    if (enemyHexes.size() > 0) {
        unit.move(enemyHexes[math.random(0, enemyHexes.size() - 1)]);
    } else {
        unit.move(alliedHexes[math.random(0, alliedHexes.size() - 1)]);
    }
}

const units: Unit[] = [];
let counter = 0;
while (counter < 5004) {
    units.push(new Unit(template1, spawnHex1));
    counter++;
}

// counter = 0
// while (counter < 250) {
//     units.push(new Unit(template2, spawnHex2));
//     counter++;
// }

while (true) {
    units.forEach((unit) => moveToEnemyHex(unit));
    wait(0.25);
}