import {NationRepository} from "./world/nation/NationRepository";
import {HexRepository} from "./world/hex/HexRepository";
import {NationReplicator} from "./world/nation/NationReplicator";
import {HexReplicator} from "./world/hex/HexReplicator";
import {Nation} from "./world/nation/Nation";
import {UnitTemplate} from "./systems/unit/template/UnitTemplate";
import {TemplateRepository} from "./systems/unit/template/TemplateRepository";
import {UnitRepository} from "./systems/unit/UnitRepository";
import {Unit} from "./systems/unit/Unit";
import {UnitReplicator} from "./systems/unit/UnitReplicator";
import {Hex} from "./world/hex/Hex";
import {RegionRepository} from "./world/region/RegionRepository";
import {RegionReplicator} from "./world/region/RegionReplicator";

NationRepository.getInstance();
HexRepository.getInstance();
RegionRepository.getInstance();
TemplateRepository.getInstance();
UnitRepository.getInstance();
NationReplicator.getInstance();
HexReplicator.getInstance();
RegionReplicator.getInstance(RegionRepository.getInstance());
UnitReplicator.getInstance();

wait(1);

const hexRepository = HexRepository.getInstance();
const nationRepository = NationRepository.getInstance();
let ponylandia: Nation = nationRepository.getById("PNL")!;
let byrdlands: Nation = nationRepository.getById("BRD")!;
let fungaria: Nation = nationRepository.getById("FNG")!;

let spawnHex1 = hexRepository.getById("H001")!;
let template1: UnitTemplate = new UnitTemplate("Infantry", 200, 60, 4, 120, new Instance("Model"), "", ponylandia);

function moveToEnemyHex(unit: Unit) {
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
while (counter < 1) {
    units.push(new Unit(template1, spawnHex1));
    counter++;
}

while (true) {
    units.forEach((unit) => moveToEnemyHex(unit));
    wait(1);
}