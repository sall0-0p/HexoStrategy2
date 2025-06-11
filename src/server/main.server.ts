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
import {DiplomaticRelation, DiplomaticRelationStatus} from "./systems/diplomacy/DiplomaticRelation";
import {NationPicker} from "./world/nation/NationPicker";
import {Modifier, ModifierType} from "./systems/modifier/Modifier";
import {ModifiableProperty} from "./systems/modifier/ModifiableProperty";

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
let fngCapital = hexRepository.getById("H005")!;
let plnInfantry: UnitTemplate = new UnitTemplate("Infantry", 200, 60, 4, 120, new Instance("Model"), "rbxassetid://91903456850255", ponylandia);
let plnMotorised: UnitTemplate = new UnitTemplate("Motorised", 200, 60, 12, 120, new Instance("Model"), "rbxassetid://72306001883478", ponylandia);
let brdUnit: UnitTemplate = new UnitTemplate("Infantry", 200, 60, 4, 120, new Instance("Model"), "rbxassetid://91903456850255", byrdlands);
let fngUnit: UnitTemplate = new UnitTemplate("Infantry", 200, 60, 4, 120, new Instance("Model"), "rbxassetid://91903456850255", fungaria);

new Unit(plnInfantry, pnlCapital);
new Unit(plnInfantry, pnlCapital);
new Unit(plnMotorised, pnlCapital);
new Unit(brdUnit, brdCapital);
new Unit(brdUnit, brdCapital);
new Unit(fngUnit, fngCapital);

wait(5);
print("Making an enemy!");
const pnlRelations = ponylandia.getRelations();
pnlRelations.set(fungaria.getId(), {
    status: DiplomaticRelationStatus.Enemy,
} as DiplomaticRelation)
pnlRelations.set(byrdlands.getId(), {
    status: DiplomaticRelationStatus.Allied,
})
ponylandia.setRelations(pnlRelations);
const region = RegionRepository.getInstance().getById("R005")!;
region.getModifierContainer().add({
    id: "test_speed_modifier",
    property: ModifiableProperty.UnitSpeed,
    type: ModifierType.Additive,
    value: 100,
} as Modifier);