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
import {RegionRepository} from "./world/region/RegionRepository";
import {RegionReplicator} from "./world/region/RegionReplicator";
import {UnitController} from "./systems/unit/UnitController";
import {DiplomaticRelationStatus} from "./systems/diplomacy/DiplomaticRelation";
import {NationPicker} from "./world/nation/NationPicker";
import {WorldTime} from "./systems/time/WorldTime";
import {UnitRecoveryTicker} from "./systems/unit/UnitRecoveryTicker";
import {UnitService} from "./systems/unit/UnitService";
import {MovementTicker} from "./systems/unit/movement/MovementTicker";
import {BattleService} from "./systems/battle/misc/BattleService";
import {TemplateController} from "./systems/unit/template/TemplateController";
import {StatsTemplate} from "../shared/classes/StatsTemplate";
import {UnitType} from "../shared/classes/UnitType";
import {Building} from "../shared/data/ts/BuildingDefs";
import {ConstructionController} from "./world/building/ConstructionController";
import {Modifier, ModifierType, ModifierVibe} from "../shared/classes/Modifier";
import {ModifiableProperty} from "../shared/classes/ModifiableProperty";
import {RTIcon} from "../shared/config/RichText";

WorldTime.getInstance();
const nationRepository = NationRepository.getInstance();
const hexRepository = HexRepository.getInstance();
const regionRepository = RegionRepository.getInstance();
TemplateRepository.getInstance();
TemplateController.getInstance();
UnitRepository.getInstance();
NationReplicator.getInstance();
HexReplicator.getInstance(hexRepository);
RegionReplicator.getInstance(RegionRepository.getInstance());
UnitReplicator.getInstance(UnitRepository.getInstance());
UnitController.getInstance();
UnitRecoveryTicker.getInstance();
const bs = BattleService.getInstance();
const us = UnitService.getInstance();
MovementTicker.getInstance((u: Unit) => us.kill(u), bs);
NationPicker.getInstance();
ConstructionController.getInstance(nationRepository, regionRepository, hexRepository);

wait(1);

let ponylandia: Nation = nationRepository.getById("PNL")!;
let byrdlands: Nation = nationRepository.getById("BRD")!;
let fungaria: Nation = nationRepository.getById("FNG")!;

let pnlCapital = hexRepository.getById("H009")!;
let brdCapital = hexRepository.getById("H003")!;
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

const opTankStats: StatsTemplate = {
    speed: 6,
    hp: 216,
    organisation: 27.5,
    recovery: 0.30,
    softAttack: 564,
    hardAttack: 558,
    defence: 525,
    breakthrough: 934,
    armor: 100,
    piercing: 107,
    hardness: 0.8,
    initiative: 0.5,
    combatWidth: 40,
    unitType: UnitType.Armored,
}

let plnInfantry: UnitTemplate = new UnitTemplate("Infantry Division", infantryStats, new Instance("Model"), "rbxassetid://91903456850255", ponylandia);
let plnMotorised: UnitTemplate = new UnitTemplate("Motorised Division", motorisedStats, new Instance("Model"), "rbxassetid://72306001883478", ponylandia);
let plnArmored: UnitTemplate = new UnitTemplate("Armored Division", opTankStats, new Instance("Model"), "rbxassetid://111943619870880", ponylandia);
let brdUnit: UnitTemplate = new UnitTemplate("Infantry Division", militiaStats, new Instance("Model"), "rbxassetid://91903456850255", byrdlands);
let fngUnit: UnitTemplate = new UnitTemplate("Fungarian Militia", infantryStats, new Instance("Model"), "rbxassetid://91903456850255", fungaria);

// → your own “ponylandia” group (at PNL capital)
new Unit(plnMotorised, pnlCapital).setName("1st Motorised Division");
new Unit(plnMotorised, pnlCapital).setName("2nd Motorised Division");
new Unit(plnMotorised, pnlCapital).setName("3rd Motorised Division");
new Unit(plnArmored, pnlCapital).setName("1st Armored Division");

// Byrdland unit
new Unit(brdUnit, brdCapital).setName("1st Infantry Division");
new Unit(brdUnit, brdCapital).setName("2nd Infantry Division");

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
pnlRelations.setRelationStatus(fungaria, DiplomaticRelationStatus.Enemy);
pnlRelations.setRelationStatus(byrdlands, DiplomaticRelationStatus.Allied);
fungaria.getRelations().setRelationStatus(byrdlands, DiplomaticRelationStatus.Enemy);

const timeManager = WorldTime.getInstance();
timeManager.setPaused(false);

const region = RegionRepository.getInstance().getById("R001");
const buildings = region!.getBuildings();
print("Civ count:", buildings.getBuildingCount(Building.CivilianFactory));
print("Infrastructure level:", buildings.getBuildingCount(Building.Infrastructure));
buildings.addBuilding(Building.CivilianFactory, 4);

const constructionManger = ponylandia.getConstructionManager();
ponylandia.getBuildings().set(Building.CivilianFactory, 25);

wait(1);
print(WorldTime.getInstance().getTimestamp());
ponylandia.getModifiers().add({
    id: "DevConstruction",
    property: ModifiableProperty.GlobalBuildSpeed,
    type: ModifierType.Additive,
    value: 4900,
    label: "Cheats, HaHA!",
    icon: RTIcon.ProductionCost,
    vibe: ModifierVibe.Positive,
} as Modifier)

ponylandia.getModifiers().add({
    id: "LimitedDevConstruction",
    property: ModifiableProperty.GlobalBuildSpeed,
    type: ModifierType.Additive,
    value: 4900,
    label: "Temporary Cheats, HaHA!",
    icon: RTIcon.ProductionCost,
    vibe: ModifierVibe.Positive,
    expireAt: WorldTime.getInstance().getTimestamp() + (86400 * 7),
} as Modifier)
// constructionManger.addProject(region!, Building.CivilianFactory);
// constructionManger.addProject(region!, Building.Infrastructure);
// print("Civ count:", buildings.getBuildingCount(Building.CivilianFactory));
// print("Civ slot count:", buildings.getSlotCount(Building.CivilianFactory));

// let i = 0;
// while (i < 1000) {
//     new Unit(plnMotorised, pnlCapital).setName(`${i}rd Motorised Division`);
//     if (i % 100 === 0) {
//         task.wait(0.05);
//     }
//     i++;
// }