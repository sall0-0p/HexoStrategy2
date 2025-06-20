import {NationRepository} from "./world/nation/NationRepository";
import {HexRepository} from "./world/hex/HexRepository";
import {NationReplicator} from "./world/nation/NationReplicator";
import {HexReplicator} from "./world/hex/HexReplicator";
import {Nation} from "./world/nation/Nation";
import {StatsTemplate, UnitTemplate, UnitType} from "./systems/unit/template/UnitTemplate";
import {TemplateRepository} from "./systems/unit/template/TemplateRepository";
import {UnitRepository} from "./systems/unit/UnitRepository";
import {Unit} from "./systems/unit/Unit";
import {UnitReplicator} from "./systems/unit/UnitReplicator";
import {RegionRepository} from "./world/region/RegionRepository";
import {RegionReplicator} from "./world/region/RegionReplicator";
import {UnitController} from "./systems/unit/UnitController";
import {DiplomaticRelationStatus} from "./systems/diplomacy/DiplomaticRelation";
import {NationPicker} from "./world/nation/NationPicker";
import {Modifier, ModifierType} from "./systems/modifier/Modifier";
import {ModifiableProperty} from "./systems/modifier/ModifiableProperty";
import {WorldTime} from "./systems/time/WorldTime";
import {Battle} from "./systems/battle/Battle";

WorldTime.getInstance();
NationRepository.getInstance();
HexRepository.getInstance();
RegionRepository.getInstance();
TemplateRepository.getInstance();
UnitRepository.getInstance();
NationReplicator.getInstance();
HexReplicator.getInstance();
RegionReplicator.getInstance(RegionRepository.getInstance());
UnitReplicator.getInstance(UnitRepository.getInstance());
UnitController.getInstance();
NationPicker.getInstance();

wait(1);

const hexRepository = HexRepository.getInstance();
const nationRepository = NationRepository.getInstance();
let ponylandia: Nation = nationRepository.getById("PNL")!;
let byrdlands: Nation = nationRepository.getById("BRD")!;
let fungaria: Nation = nationRepository.getById("FNG")!;

let pnlCapital = hexRepository.getById("H009")!;
let brdCapital = hexRepository.getById("H002")!;
const fngInferiorHex    = hexRepository.getById("H005")!;   // weak enemy
const fngSuperiorHex    = hexRepository.getById("H006")!;

const infantryStats: StatsTemplate = {
    speed: 4,
    hp: 230,
    organisation: 60,
    recovery: 0.25,
    softAttack: 150,
    hardAttack: 30,
    defence: 500,
    breakthrough: 100,
    armor: 3,
    piercing: 15,
    hardness: 0,
    initiative: 0.3,
    combatWidth: 27,
    unitType: UnitType.Infantry,
};

const militiaStats: StatsTemplate = {
    speed: 4,              // slower movement
    hp: 140,                 // less durability
    organisation: 35,        // lower cohesion
    recovery: 0.15,          // slower recovery
    softAttack: 90,          // weaker against soft targets
    hardAttack: 15,          // weaker anti‐armour
    defence: 300,            // lower defence value
    breakthrough: 50,        // reduced punch-through
    armor: 1,                // minimal protection
    piercing: 8,             // lower armour penetration
    hardness: 0,             // still soft
    initiative: 0.2,         // slower to act
    combatWidth: 27,         // same width so density drops even more
    unitType: UnitType.Infantry,
};

const motorisedStats: StatsTemplate = {
    speed: 12,
    hp: 250,
    organisation: 60,
    recovery: 0.25,
    softAttack: 150,
    hardAttack: 35,
    defence: 500,
    breakthrough: 125,
    armor: 3,
    piercing: 15,
    hardness: 0.1,
    initiative: 0.5,
    combatWidth: 27,
    unitType: UnitType.Motorised,
};

let plnInfantry: UnitTemplate = new UnitTemplate("Infantry", infantryStats, new Instance("Model"), "rbxassetid://91903456850255", ponylandia);
let plnMotorised: UnitTemplate = new UnitTemplate("Motorised", motorisedStats, new Instance("Model"), "rbxassetid://72306001883478", ponylandia);
let brdUnit: UnitTemplate = new UnitTemplate("Militia", militiaStats, new Instance("Model"), "rbxassetid://91903456850255", byrdlands);
let fngUnit: UnitTemplate = new UnitTemplate("Infantry", infantryStats, new Instance("Model"), "rbxassetid://91903456850255", fungaria);

// → your own “ponylandia” group (at PNL capital)
new Unit(plnMotorised, pnlCapital);
new Unit(plnMotorised, pnlCapital);
new Unit(plnMotorised, pnlCapital);

// → inferior fungaria group (2 divisions)
new Unit(fngUnit, fngInferiorHex);
new Unit(fngUnit, fngInferiorHex);

// → superior fungaria group (5 divisions)
new Unit(fngUnit, fngSuperiorHex);
new Unit(fngUnit, fngSuperiorHex);
new Unit(fngUnit, fngSuperiorHex);
new Unit(fngUnit, fngSuperiorHex);
new Unit(fngUnit, fngSuperiorHex);

wait(5);
print("Making an enemy!");
const pnlRelations = ponylandia.getRelations();
pnlRelations.setRelationStatus(fungaria, DiplomaticRelationStatus.Enemy)
pnlRelations.setRelationStatus(byrdlands, DiplomaticRelationStatus.Allied);

const timeManager = WorldTime.getInstance();
timeManager.setPaused(false);