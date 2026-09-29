"use strict";

// shared/unit_cells.js: the capability-cell rules a race player's units, mods
// and deals follow. See races.md, "Capability cells".

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const cells = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_cells.js"
);

const T = (list) => list.split(" ").map((tag) => "UNITTYPE_" + tag);

// Vanilla ant, stryker, skitter and dox with their weapon/ammo chains, a
// factory, a commander and a race (Custom7) counterpart of each, so every
// rule has both sides. The commander builds the factory and the factory the
// three tanks, so their jobs count: the ant and the stryker have none and
// stand for the race tank, and the skitter's Scout job is no race unit's.
// The race side's rx_ paths are this file's own: scripts/lib/race-fixture.js
// gives its fx_ paths other specs, so no path names two units in the suite.
const ANT = "/pa/units/land/tank_light_laser/tank_light_laser.json";
const ANT_WEAPON =
  "/pa/units/land/tank_light_laser/tank_light_laser_tool_weapon.json";
const ANT_AMMO = "/pa/units/land/tank_light_laser/tank_light_laser_ammo.json";
const STRYKER = "/pa/units/land/attack_vehicle/attack_vehicle.json";
const STRYKER_WEAPON =
  "/pa/units/land/attack_vehicle/attack_vehicle_tool_weapon.json";
const STRYKER_AMMO = "/pa/units/land/attack_vehicle/attack_vehicle_ammo.json";
const SKITTER = "/pa/units/land/land_scout/land_scout.json";
const SKITTER_WEAPON = "/pa/units/land/land_scout/land_scout_tool_weapon.json";
const SKITTER_AMMO = "/pa/units/land/land_scout/land_scout_ammo.json";
const DOX = "/pa/units/land/assault_bot/assault_bot.json";
const DOX_AMMO = "/pa/units/land/assault_bot/assault_bot_ammo.json";
const FACTORY = "/pa/units/land/vehicle_factory/vehicle_factory.json";
const FACTORY_ARM =
  "/pa/units/land/vehicle_factory/vehicle_factory_build_arm.json";
const COMMANDER = "/pa/units/commanders/base_commander/base_commander.json";
const COLONEL =
  "/pa/units/land/bot_support_commander/bot_support_commander.json";
const BASE_VEHICLE = "/pa/units/land/base_vehicle/base_vehicle.json";
const FX_TANK = "/pa/units/land/rx_tank/rx_tank.json";
const FX_TANK_WEAPON = "/pa/units/land/rx_tank/rx_tank_tool_weapon.json";
const FX_TANK_AMMO = "/pa/units/land/rx_tank/rx_tank_ammo.json";
const FX_TANK2 = "/pa/units/land/rx_tank2/rx_tank2.json";
const FX_TANK2_AMMO = "/pa/units/land/rx_tank2/rx_tank2_ammo.json";
const FX_FACTORY = "/pa/units/land/rx_vehicle_factory/rx_vehicle_factory.json";
const FX_FACTORY_ARM =
  "/pa/units/land/rx_vehicle_factory/rx_vehicle_factory_build_arm.json";
const FX_COMMANDER = "/pa/units/commanders/rx_alpha/rx_alpha.json";
const FX_COMMANDER_AMMO = "/pa/units/commanders/rx_alpha/rx_alpha_ammo.json";

const SPECS = {
  [BASE_VEHICLE]: { unit_types: T("Land Mobile Tank NoBuild") },
  [ANT]: {
    base_spec: BASE_VEHICLE,
    unit_types: T("Basic Land Mobile Offense Tank Custom58 FactoryBuild"),
    tools: [{ spec_id: ANT_WEAPON }],
  },
  [ANT_WEAPON]: { ammo_id: ANT_AMMO },
  [ANT_AMMO]: { damage: 10 },
  [STRYKER]: {
    base_spec: BASE_VEHICLE,
    unit_types: T("Basic Land Mobile Offense Tank Custom58 FactoryBuild"),
    tools: [{ spec_id: STRYKER_WEAPON }],
  },
  [STRYKER_WEAPON]: { ammo_id: STRYKER_AMMO },
  [STRYKER_AMMO]: { damage: 8 },
  [SKITTER]: {
    base_spec: BASE_VEHICLE,
    unit_types: T(
      "Basic Land Mobile Offense Scout Tank Vehicle Custom58 FactoryBuild"
    ),
    tools: [{ spec_id: SKITTER_WEAPON }],
  },
  [SKITTER_WEAPON]: { ammo_id: [{ id: SKITTER_AMMO }] },
  [SKITTER_AMMO]: { damage: 1 },
  [DOX]: {
    unit_types: T("Basic Bot Land Mobile Offense Custom58"),
    tools: [
      { spec_id: "/pa/units/land/assault_bot/assault_bot_tool_weapon.json" },
    ],
    death_weapon: { ground_ammo_spec: DOX_AMMO },
  },
  "/pa/units/land/assault_bot/assault_bot_tool_weapon.json": {
    ammo_id: DOX_AMMO,
  },
  [DOX_AMMO]: {},
  [FACTORY]: {
    unit_types: T(
      "Basic Construction Factory Land Structure Tank CmdBuild Custom58"
    ),
    buildable_types: "FactoryBuild & Custom58",
    tools: [{ spec_id: FACTORY_ARM }],
  },
  [FACTORY_ARM]: { construction_demand: { metal: 10 } },
  [COMMANDER]: {
    unit_types: T("Commander Construction Land Mobile Custom58"),
    buildable_types: "CmdBuild & Custom58",
  },
  [COLONEL]: {
    unit_types: T(
      "Advanced Bot Construction Fabber Land Mobile SupportCommander Custom58"
    ),
  },
  // The race's Custom7 side. The weapon inherits its ammo from a base tool.
  [FX_TANK]: {
    base_spec: BASE_VEHICLE,
    unit_types: T("Basic Land Mobile Offense Tank Custom7"),
    tools: [{ spec_id: FX_TANK_WEAPON }],
  },
  [FX_TANK_WEAPON]: { base_spec: "/pa/tools/rx_base_weapon.json" },
  "/pa/tools/rx_base_weapon.json": { ammo_id: FX_TANK_AMMO },
  [FX_TANK_AMMO]: { damage: 12 },
  [FX_TANK2]: {
    base_spec: BASE_VEHICLE,
    tools: [{ spec_id: "/pa/units/land/rx_tank2/rx_tank2_tool_weapon.json" }],
  },
  "/pa/units/land/rx_tank2/rx_tank2_tool_weapon.json": {
    ammo_id: FX_TANK2_AMMO,
  },
  [FX_TANK2_AMMO]: {},
  [FX_FACTORY]: {
    unit_types: T("Basic Construction Factory Land Structure Tank Custom7"),
    tools: [{ spec_id: FX_FACTORY_ARM }],
  },
  [FX_FACTORY_ARM]: {},
  [FX_COMMANDER]: {
    unit_types: T("Commander Construction Land Mobile Custom7"),
    tools: [
      { spec_id: "/pa/units/commanders/rx_alpha/rx_alpha_tool_weapon.json" },
    ],
  },
  "/pa/units/commanders/rx_alpha/rx_alpha_tool_weapon.json": {
    ammo_id: FX_COMMANDER_AMMO,
  },
  [FX_COMMANDER_AMMO]: {},
};
const UNITS = Object.keys(SPECS).filter((p) =>
  /\/units\/.*\/([^/]+)\/\1\.json$/.test(p)
);

const vanilla = cells.buildIndex(UNITS, SPECS, cells.vanillaMember);
const race = cells.buildIndex(UNITS, SPECS, cells.raceMember("Custom7"));

describe("classify", () => {
  const key = (list) => cells.classify(T(list)).key;

  it("strips the bits that say nothing about what a unit is for", () => {
    assert.deepEqual(
      cells.stripTypes(
        T(
          "Custom58 FactoryBuild CmdBuild FabBuild CombatFabAdvBuild Important Bot Mobile Debug"
        )
      ),
      ["Bot", "Mobile"]
    );
    assert.deepEqual(cells.stripTypes(undefined), []);
  });

  it("reads domain, tier and class off the types", () => {
    assert.equal(key("Air Basic Bomber Mobile Offense"), "Air/Basic/Combat");
    assert.equal(
      key("Basic Bot Construction Fabber Land Mobile"),
      "Bot/Basic/Fabber"
    );
    assert.equal(
      key("Basic Bot Construction Land Mobile Offense"),
      "Bot/Basic/Combat"
    );
    assert.equal(key("Basic Land Mobile Offense Tank"), "Vehicle/Basic/Combat");
    assert.equal(
      key("Advanced Land Mobile Offense Vehicle"),
      "Vehicle/Advanced/Combat"
    );
    assert.equal(
      key("Basic Bot Construction Factory Land Structure"),
      "Bot/Basic/Factory"
    );
    assert.equal(
      key("Advanced Defense Factory Land NukeDefense Structure"),
      "Land/Advanced/Defense"
    );
    assert.equal(
      key("Advanced Factory Land Nuke Offense Structure"),
      "Land/Advanced/Superweapon"
    );
    assert.equal(
      key("Advanced ControlModule Structure"),
      "Land/Advanced/Superweapon"
    );
    assert.equal(
      key("Advanced Artillery Factory Structure"),
      "Land/Advanced/Factory"
    );
    assert.equal(
      key("Basic Economy MetalProduction Structure"),
      "Land/Basic/Metal"
    );
    assert.equal(
      key("Advanced Economy EnergyProduction Structure"),
      "Land/Advanced/Energy"
    );
    assert.equal(key("Basic Economy Structure"), "Land/Basic/Storage");
    assert.equal(key("Basic Land Radar Recon Structure"), "Land/Basic/Intel");
    assert.equal(key("Structure Teleporter"), "Land/Basic/Teleporter");
    assert.equal(key("Basic Structure Wall"), "Land/Basic/Defense");
    assert.equal(key("Structure"), "Land/Basic/Structure");
  });

  it("orders the domains so shared tags land where the groups put them", () => {
    assert.equal(
      key("Basic Construction Factory Land Orbital Structure"),
      "Orbital/Basic/Factory"
    );
    assert.equal(key("Defense Land Naval Structure"), "Land/Basic/Defense");
    assert.equal(key("Basic Defense Naval Structure"), "Naval/Basic/Defense");
    assert.equal(
      key("Economy EnergyProduction MetalProduction Orbital Structure"),
      "Orbital/Basic/Metal"
    );
    assert.equal(
      key("Advanced Defense Orbital OrbitalDefense Structure"),
      "Orbital/Advanced/Defense"
    );
    assert.equal(
      key("Advanced LaserPlatform Mobile Offense Orbital Titan"),
      "Orbital/Advanced/Titan"
    );
    assert.equal(
      key("Advanced Amphibious Bot Land Mobile Offense Titan"),
      "Bot/Advanced/Titan"
    );
  });

  it("keeps commanders and support commanders in a class of their own", () => {
    assert.equal(
      key("Commander Construction Land Mobile Offense"),
      "Land/Basic/Commander"
    );
    assert.equal(
      key(
        "Advanced Amphibious Bot Construction Fabber Land Mobile SupportCommander"
      ),
      "Bot/Advanced/Commander"
    );
    assert.equal(cells.isCommanderCell("Bot/Advanced/Commander"), true);
    assert.equal(cells.isCommanderCell("Bot/Advanced/Combat"), false);
    assert.equal(cells.isCommanderCell(undefined), false);
  });
});

describe("effectiveTypes and partsOf", () => {
  it("walks the base_spec chain until a unit_types array, a child replacing its base", () => {
    assert.deepEqual(
      cells.effectiveTypes(FX_TANK2, SPECS),
      T("Land Mobile Tank NoBuild")
    );
    assert.deepEqual(cells.effectiveTypes(ANT, SPECS), SPECS[ANT].unit_types);
    assert.deepEqual(cells.effectiveTypes("/pa/units/none.json", SPECS), []);
    const loop = { a: { base_spec: "b" }, b: { base_spec: "a" } };
    assert.deepEqual(cells.effectiveTypes("a", loop), []);
  });

  it("names a unit's tools as weapons or build arms, its ammo and its death ammo, once each", () => {
    assert.deepEqual(cells.partsOf(ANT, SPECS), [
      { path: ANT_WEAPON, role: "weapon" },
      { path: ANT_AMMO, role: "ammo" },
    ]);
    assert.deepEqual(cells.partsOf(SKITTER, SPECS), [
      { path: SKITTER_WEAPON, role: "weapon" },
      { path: SKITTER_AMMO, role: "ammo" },
    ]);
    assert.deepEqual(cells.partsOf(DOX, SPECS), [
      {
        path: "/pa/units/land/assault_bot/assault_bot_tool_weapon.json",
        role: "weapon",
      },
      { path: DOX_AMMO, role: "ammo" },
      { path: DOX_AMMO, role: "deathAmmo" },
    ]);
    assert.deepEqual(cells.partsOf(FACTORY, SPECS), [
      { path: FACTORY_ARM, role: "buildArm" },
    ]);
    // The race weapon inherits its ammo through a base tool.
    assert.deepEqual(cells.partsOf(FX_TANK, SPECS), [
      { path: FX_TANK_WEAPON, role: "weapon" },
      { path: FX_TANK_AMMO, role: "ammo" },
    ]);
    assert.deepEqual(cells.partsOf("/pa/units/none.json", SPECS), []);
  });
});

describe("buildIndex", () => {
  it("keeps the members only, cells them, and indexes parts by role and owner", () => {
    // No faction bit at all reads as vanilla, base specs included.
    assert.deepEqual(vanilla.units, [
      BASE_VEHICLE,
      ANT,
      STRYKER,
      SKITTER,
      DOX,
      FACTORY,
      COMMANDER,
      COLONEL,
      FX_TANK2,
    ]);
    assert.deepEqual(vanilla.unitsByCell["Vehicle/Basic/Combat"], [
      STRYKER,
      BASE_VEHICLE,
      SKITTER,
      FX_TANK2,
      ANT,
    ]);
    assert.equal(vanilla.cellOf[DOX], "Bot/Basic/Combat");
    assert.deepEqual(vanilla.jobsOf[SKITTER], ["Scout"]);
    assert.deepEqual(vanilla.jobsOf[ANT], []);
    assert.deepEqual(vanilla.jobsOf[FACTORY], []);
    assert.deepEqual(vanilla.partIndex[ANT_AMMO], {
      role: "ammo",
      units: [ANT],
    });
    assert.deepEqual(vanilla.partIndex[FACTORY_ARM], {
      role: "buildArm",
      units: [FACTORY],
    });
    assert.deepEqual(race.units, [FX_TANK, FX_FACTORY, FX_COMMANDER]);
    assert.equal(race.cellOf[FX_TANK2], undefined);
    assert.deepEqual(race.unitsByCell["Land/Basic/Commander"], [FX_COMMANDER]);
    assert.deepEqual(
      cells.buildIndex(["/pa/units/none.json"], SPECS, cells.vanillaMember)
        .units,
      []
    );
  });

  it("marks what a commander can build, and what that builds, as fieldable", () => {
    // Not the commander itself, nor a base spec nothing builds.
    assert.deepEqual(Object.keys(vanilla.fieldable).sort(), [
      STRYKER,
      SKITTER,
      ANT,
      FACTORY,
    ]);
    const noBuildList = Object.assign({}, SPECS, {
      [COMMANDER]: { unit_types: SPECS[COMMANDER].unit_types },
    });
    assert.deepEqual(
      cells.buildIndex(UNITS, noBuildList, cells.vanillaMember).fieldable,
      {}
    );
  });

  it("tells vanilla from a race by faction bit", () => {
    assert.equal(cells.vanillaMember(T("Bot Custom58")), true);
    assert.equal(cells.vanillaMember(T("Bot")), true);
    assert.equal(cells.vanillaMember(T("Bot Custom1")), false);
    assert.equal(cells.raceMember("Custom1")(T("Bot Custom1")), true);
    assert.equal(cells.raceMember("Custom1")(T("Bot Custom58")), false);
  });
});

describe("raceUnitsFor", () => {
  it("grants the race units the held ones stand for and passes the rest through", () => {
    assert.deepEqual(
      cells.raceUnitsFor(
        [ANT, SKITTER, FACTORY, FX_COMMANDER, "/pa/units/mod/x.json", ANT],
        vanilla,
        race
      ),
      [FX_COMMANDER, "/pa/units/mod/x.json", FX_TANK, FX_FACTORY]
    );
    assert.deepEqual(cells.raceUnitsFor([DOX], vanilla, race), []);
    assert.deepEqual(cells.raceUnitsFor(undefined, vanilla, race), []);
    // A vanilla part (model.gwoSpecs lists the ones cards mod) is neither
    // granted nor passed through: the race's parts come with its units.
    assert.deepEqual(
      cells.raceUnitsFor([ANT_AMMO, FACTORY_ARM, ANT], vanilla, race),
      [FX_TANK]
    );
  });

  it("grants a race unit in a cell vanilla never fills when something granted can build it", () => {
    // Bugs' research: a factory (granted with the vanilla factory's cell)
    // builds an unlock token that sits in a cell of its own.
    const RESEARCH = "/pa/units/research/rx_research/rx_research.json";
    const TOKEN = "/pa/units/research/rx_token/rx_token.json";
    const TOKEN2 = "/pa/units/research/rx_token2/rx_token2.json";
    const specs = Object.assign({}, SPECS, {
      [RESEARCH]: {
        unit_types: T("Basic Construction Factory Land Structure Tank Custom7"),
        buildable_types: "(Custom7 & FactoryBuild & Basic & Tank) - Mobile",
      },
      [TOKEN]: {
        unit_types: T("Basic Land Structure Tank FactoryBuild Custom7"),
        buildable_types: "Custom7 & Token",
      },
      // Reached only through the first token, so a second pass is needed.
      [TOKEN2]: { unit_types: T("Advanced Structure Token Custom7") },
    });
    const units = UNITS.concat([RESEARCH, TOKEN, TOKEN2]);
    const v = cells.buildIndex(units, specs, cells.vanillaMember);
    const r = cells.buildIndex(units, specs, cells.raceMember("Custom7"));

    assert.equal(r.cellOf[TOKEN], "Vehicle/Basic/Structure");
    assert.equal(v.unitsByCell["Vehicle/Basic/Structure"], undefined);
    assert.deepEqual(cells.raceUnitsFor([FACTORY], v, r), [
      FX_FACTORY,
      RESEARCH,
      TOKEN,
      TOKEN2,
    ]);
    // Nothing granted can build the tokens: they stay out.
    assert.deepEqual(cells.raceUnitsFor([ANT], v, r), [FX_TANK]);
  });

  it("never grants a commander cell, keeping a held vanilla commander-class unit instead", () => {
    assert.deepEqual(cells.raceUnitsFor([COMMANDER, COLONEL], vanilla, race), [
      COMMANDER,
      COLONEL,
    ]);
    assert.deepEqual(
      cells.heldCommanderUnits([ANT, COLONEL, COLONEL, "x"], vanilla),
      [COLONEL]
    );
  });
});

describe("expandMods", () => {
  const mod = (file, path, value, op) => ({
    file,
    path,
    op: op || "multiply",
    value,
  });

  it("lands a unit mod on the race units it stands for and a part mod on their parts of the role", () => {
    assert.deepEqual(
      cells.expandMods(
        [
          mod(ANT, "max_health", 2),
          mod(ANT_AMMO, "damage", 3),
          mod(FACTORY_ARM, "construction_demand.metal", 0.5),
          mod(ANT_WEAPON, "rate_of_fire", 4),
        ],
        vanilla,
        race
      ),
      [
        mod(FX_TANK, "max_health", 2),
        mod(FX_TANK_AMMO, "damage", 3),
        mod(FX_FACTORY_ARM, "construction_demand.metal", 0.5),
        mod(FX_TANK_WEAPON, "rate_of_fire", 4),
      ]
    );
  });

  it("drops a mod on a vanilla file the race has no cell-mate for, keeps foreign and file-less mods", () => {
    const foreign = mod("/pa/units/mod/x.json", "a", 1);
    const evalMod = { path: "x", op: "eval", value: "1" };
    assert.deepEqual(
      cells.expandMods(
        [
          mod(DOX, "max_health", 2),
          mod(DOX_AMMO, "damage", 2),
          foreign,
          evalMod,
          undefined,
        ],
        vanilla,
        race
      ),
      [foreign, evalMod, undefined]
    );
  });

  it("keeps the original beside the expansion when the army still holds its file", () => {
    assert.deepEqual(
      cells.expandMods(
        [mod(COMMANDER, "max_health", 2)],
        vanilla,
        race,
        (file) => file === COMMANDER
      ),
      [mod(COMMANDER, "max_health", 2), mod(FX_COMMANDER, "max_health", 2)]
    );
    assert.deepEqual(
      cells.expandMods(
        [mod(COMMANDER, "max_health", 2)],
        vanilla,
        race,
        () => false
      ),
      [mod(FX_COMMANDER, "max_health", 2)]
    );
  });

  it("lands a change once on a vanilla part the race also mounts", () => {
    // Legion's commanders fire the stock commander AA ammo, so that file is
    // both the army's own and one of the race's parts.
    const MAIN_WEAPON =
      "/pa/units/commanders/base_commander/base_commander_tool_laser_weapon.json";
    const MAIN_AMMO =
      "/pa/units/commanders/base_commander/base_commander_ammo_laser.json";
    const AA_WEAPON =
      "/pa/units/commanders/base_commander/base_commander_tool_aa_weapon.json";
    const AA_AMMO =
      "/pa/units/commanders/base_commander/base_commander_aa_ammo.json";
    const FX_COMMANDER2 = "/pa/units/commanders/rx_beta/rx_beta.json";
    const specs = Object.assign({}, SPECS, {
      [COMMANDER]: Object.assign({}, SPECS[COMMANDER], {
        tools: [{ spec_id: MAIN_WEAPON }, { spec_id: AA_WEAPON }],
      }),
      [MAIN_WEAPON]: { ammo_id: MAIN_AMMO },
      [MAIN_AMMO]: { damage: 80 },
      [AA_WEAPON]: { ammo_id: AA_AMMO },
      [AA_AMMO]: { damage: 200 },
      [FX_COMMANDER2]: {
        unit_types: T("Commander Construction Land Mobile Custom7"),
        tools: [{ spec_id: AA_WEAPON }],
      },
    });
    const units = UNITS.concat([FX_COMMANDER2]);
    const v = cells.buildIndex(units, specs, cells.vanillaMember);
    const r = cells.buildIndex(units, specs, cells.raceMember("Custom7"));
    const has = (file) => file === AA_AMMO;

    // Kept as itself, and not landed on itself again as a race part.
    assert.deepEqual(
      cells.expandMods([mod(AA_AMMO, "damage", 1.25)], v, r, has),
      [mod(AA_AMMO, "damage", 1.25), mod(FX_COMMANDER_AMMO, "damage", 1.25)]
    );

    // Reached first as a race part of the main gun's change, the kept
    // original joins that pass.
    const group = [
      mod(MAIN_AMMO, "damage", 1.25),
      mod(AA_AMMO, "damage", 1.25),
    ];
    assert.deepEqual(cells.expandMods(group, v, r, has), [
      mod(FX_COMMANDER_AMMO, "damage", 1.25),
      mod(AA_AMMO, "damage", 1.25),
    ]);

    // A second card still stacks.
    assert.deepEqual(cells.expandMods(group.concat(group), v, r, has), [
      mod(FX_COMMANDER_AMMO, "damage", 1.25),
      mod(AA_AMMO, "damage", 1.25),
      mod(FX_COMMANDER_AMMO, "damage", 1.25),
      mod(AA_AMMO, "damage", 1.25),
    ]);

    // The documented limit (races.md): the passes carry no card. One card
    // naming the main gun's ammo and another naming the AA ammo with the same
    // change give the list above, so the AA ammo takes the change once, as
    // every race part in the pass does.
    const twoCards = [mod(MAIN_AMMO, "damage", 1.25)].concat([
      mod(AA_AMMO, "damage", 1.25),
    ]);
    assert.deepEqual(cells.expandMods(twoCards, v, r, has), [
      mod(FX_COMMANDER_AMMO, "damage", 1.25),
      mod(AA_AMMO, "damage", 1.25),
    ]);

    // A stockOnly change sits outside the passes, so the second card still
    // lands on the AA ammo.
    const stockOnlyAa = Object.assign(mod(AA_AMMO, "damage", 1.25), {
      stockOnly: true,
    });
    assert.deepEqual(
      cells.expandMods(
        [mod(MAIN_AMMO, "damage", 1.25), stockOnlyAa],
        v,
        r,
        has
      ),
      [
        mod(FX_COMMANDER_AMMO, "damage", 1.25),
        mod(AA_AMMO, "damage", 1.25),
        stockOnlyAa,
      ]
    );
  });

  it("keeps a stockOnly change on the file it names, where the army holds it", () => {
    const stockOnly = (file, path, value) =>
      Object.assign(mod(file, path, value), { stockOnly: true });
    const antHealth = stockOnly(ANT, "max_health", 1.5);
    const antOnly = (file) => file === ANT;

    // Never landed on the race's cell-mate.
    assert.deepEqual(cells.expandMods([antHealth], vanilla, race, antOnly), [
      antHealth,
    ]);
    // Dropped where the army lacks the file, kept where no `has` is given.
    assert.deepEqual(
      cells.expandMods([antHealth], vanilla, race, () => false),
      []
    );
    assert.deepEqual(cells.expandMods([antHealth], vanilla, race), [antHealth]);
    // It does not remake the file: another change to the Ant still travels.
    assert.deepEqual(
      cells.expandMods(
        [antHealth, mod(ANT, "max_health", 1.2)],
        vanilla,
        race,
        antOnly
      ),
      [antHealth, mod(ANT, "max_health", 1.2), mod(FX_TANK, "max_health", 1.2)]
    );
  });

  it("applies a group card once per pass, and stacks a second card", () => {
    const oneCard = [
      mod(ANT_AMMO, "damage", 1.25),
      mod(STRYKER_AMMO, "damage", 1.25),
      mod(SKITTER_AMMO, "damage", 1.25),
    ];
    assert.deepEqual(cells.expandMods(oneCard, vanilla, race), [
      mod(FX_TANK_AMMO, "damage", 1.25),
    ]);

    const twoCards = oneCard.concat(oneCard);
    assert.deepEqual(cells.expandMods(twoCards, vanilla, race), [
      mod(FX_TANK_AMMO, "damage", 1.25),
      mod(FX_TANK_AMMO, "damage", 1.25),
    ]);

    // A different value or path is its own pass.
    assert.deepEqual(
      cells.expandMods(
        [
          mod(ANT_AMMO, "damage", 1.25),
          mod(STRYKER_AMMO, "damage", 2),
          mod(ANT_AMMO, "splash_damage", 1.25),
        ],
        vanilla,
        race
      ),
      [
        mod(FX_TANK_AMMO, "damage", 1.25),
        mod(FX_TANK_AMMO, "damage", 2),
        mod(FX_TANK_AMMO, "splash_damage", 1.25),
      ]
    );
  });

  it("lands a part shared across cells by its home directory, once", () => {
    // The Dox's ammo also arms an advanced vehicle: a bots card naming it
    // must reach the race's basic bot ammo once and no race tank ammo.
    const SHARED_TANK = "/pa/units/land/shared_tank/shared_tank.json";
    const FX_BOT = "/pa/units/land/rx_bot/rx_bot.json";
    const FX_BOT_AMMO = "/pa/units/land/rx_bot/rx_bot_ammo.json";
    const FX_BOT2 = "/pa/units/land/rx_bot2/rx_bot2.json";
    const FX_BOT2_AMMO = "/pa/units/land/rx_bot2/rx_bot2_ammo.json";
    const specs = Object.assign({}, SPECS, {
      [SHARED_TANK]: {
        unit_types: T("Advanced Land Mobile Offense Tank Custom58"),
        tools: [
          { spec_id: "/pa/units/land/shared_tank/shared_tank_tool.json" },
        ],
      },
      "/pa/units/land/shared_tank/shared_tank_tool.json": { ammo_id: DOX_AMMO },
      [FX_BOT]: {
        unit_types: T("Basic Bot Land Mobile Offense Custom7"),
        tools: [{ spec_id: "/pa/units/land/rx_bot/rx_bot_tool.json" }],
      },
      "/pa/units/land/rx_bot/rx_bot_tool.json": { ammo_id: FX_BOT_AMMO },
      [FX_BOT_AMMO]: {},
      [FX_BOT2]: {
        unit_types: T("Basic Bot Land Mobile Offense Custom7"),
        tools: [{ spec_id: "/pa/units/land/rx_bot2/rx_bot2_tool.json" }],
      },
      "/pa/units/land/rx_bot2/rx_bot2_tool.json": { ammo_id: FX_BOT2_AMMO },
      [FX_BOT2_AMMO]: {},
    });
    const units = UNITS.concat([SHARED_TANK, FX_BOT, FX_BOT2]);
    const v = cells.buildIndex(units, specs, cells.vanillaMember);
    const r = cells.buildIndex(units, specs, cells.raceMember("Custom7"));

    assert.deepEqual(v.partIndex[DOX_AMMO].units, [DOX]);
    assert.deepEqual(
      cells.expandMods(
        [mod(DOX_AMMO, "damage", 1.25), mod(DOX_AMMO, "damage", 1.25)],
        v,
        r
      ),
      [
        mod(FX_BOT_AMMO, "damage", 1.25),
        mod(FX_BOT2_AMMO, "damage", 1.25),
        mod(FX_BOT_AMMO, "damage", 1.25),
        mod(FX_BOT2_AMMO, "damage", 1.25),
      ]
    );
  });

  it("leaves an identity mod on its own unit: exact, or on a type/build/tool path", () => {
    const identity = [
      mod(ANT, "unit_types", ["UNITTYPE_Commander"], "replace"),
      mod(ANT, "buildable_types", "CmdBuild & Custom58", "replace"),
      mod(ANT, "tools.1.spec_id", "/pa/tools/x.json", "replace"),
      { file: ANT, path: "tools.1.spec_id", op: "tag" },
      mod(ANT, "command_caps", ["ORDER_Build"], "replace"),
      mod(ANT, "transportable.size", 1, "replace"),
      Object.assign(mod(ANT, "max_health", 5), { exact: true }),
      Object.assign(mod(ANT, "build_metal_cost", 25000, "replace"), {
        exact: true,
      }),
    ];
    assert.deepEqual(cells.expandMods(identity, vanilla, race), identity);
    // A stat mod on the same file travels on its own...
    assert.deepEqual(
      cells.expandMods([mod(ANT, "max_health", 2)], vanilla, race),
      [mod(FX_TANK, "max_health", 2)]
    );
    // ...but not once the list remakes the unit: the cost and health of a
    // conversion belong to it.
    const conversion = [
      mod(ANT, "max_health", 5),
      mod(ANT, "unit_types", ["UNITTYPE_Commander"], "replace"),
      mod(ANT, "build_metal_cost", 25000, "replace"),
      mod(STRYKER, "max_health", 2),
    ];
    assert.deepEqual(cells.expandMods(conversion, vanilla, race), [
      mod(ANT, "max_health", 5),
      mod(ANT, "unit_types", ["UNITTYPE_Commander"], "replace"),
      mod(ANT, "build_metal_cost", 25000, "replace"),
      mod(FX_TANK, "max_health", 2),
    ]);
  });

  it("does not mutate the descriptors it is given", () => {
    const original = mod(ANT, "max_health", 2);
    cells.expandMods([original], vanilla, race);
    assert.equal(original.file, ANT);
  });
});

describe("unitList", () => {
  it("flattens nested lists, drops repeats, ignores a table, and keeps a typo", () => {
    assert.deepEqual(cells.unitList([ANT, [DOX, [ANT]], { x: SKITTER }]), [
      ANT,
      DOX,
    ]);
    assert.deepEqual(cells.unitList(ANT), [ANT]);
    assert.deepEqual(cells.unitList(undefined), []);
    assert.deepEqual(cells.unitList([undefined]), [undefined]);
  });
});

describe("unitPaths", () => {
  it("keeps order and repeats, copies a flat list, and ignores a table", () => {
    const flat = [ANT, DOX, ANT];
    const paths = cells.unitPaths(flat);

    assert.deepEqual(paths, flat);
    assert.notEqual(paths, flat);
    assert.deepEqual(cells.unitPaths([ANT, [DOX], { x: SKITTER }]), [ANT, DOX]);
    assert.deepEqual(cells.unitPaths(undefined), []);
    assert.deepEqual(cells.unitPaths(null), []);
  });
});

describe("expandMods pass-through", () => {
  it("changes a pass-through file as named, never re-aimed by cell", () => {
    const antMod = { file: ANT, path: "max_health", op: "multiply", value: 2 };
    assert.deepEqual(
      cells.expandMods([antMod], vanilla, race, undefined, { [ANT]: true }),
      [antMod]
    );
  });
});

describe("cardUsable", () => {
  it("is true when a unit the card names stands for a race unit", () => {
    assert.equal(cells.cardUsable([ANT, DOX], vanilla, race), true);
    assert.equal(cells.cardUsable([DOX], vanilla, race), false);
    assert.equal(cells.cardUsable([SKITTER], vanilla, race), false);
    assert.equal(
      cells.cardUsable(["/pa/units/mod/x.json"], vanilla, race),
      false
    );
    assert.equal(cells.cardUsable([], vanilla, race), false);
  });
});

describe("cardUnitsFor", () => {
  it("lists the race units each unit a card names stands for, once each, in card order", () => {
    assert.deepEqual(cells.cardUnitsFor([ANT], vanilla, race), [FX_TANK]);
    assert.deepEqual(cells.cardUnitsFor([ANT, STRYKER, ANT], vanilla, race), [
      FX_TANK,
    ]);
    assert.deepEqual(cells.cardUnitsFor([SKITTER], vanilla, race), []);
    assert.deepEqual(cells.cardUnitsFor([FACTORY, ANT], vanilla, race), [
      FX_FACTORY,
      FX_TANK,
    ]);
    assert.deepEqual(cells.cardUnitsFor([DOX], vanilla, race), []);
    assert.deepEqual(cells.cardUnitsFor(undefined, vanilla, race), []);
  });

  it("keeps a commander-cell path and, unlike raceUnitsFor, any path with no cell", () => {
    assert.deepEqual(cells.cardUnitsFor([COMMANDER, COLONEL], vanilla, race), [
      COMMANDER,
      COLONEL,
    ]);
    assert.deepEqual(
      cells.cardUnitsFor(["/pa/units/mod/x.json", ANT_AMMO], vanilla, race),
      ["/pa/units/mod/x.json", ANT_AMMO]
    );
  });

  it("has no build reach: a factory card lists factories, not what they build", () => {
    const RESEARCH = "/pa/units/research/rx_research/rx_research.json";
    const TOKEN = "/pa/units/research/rx_token/rx_token.json";
    const specs = Object.assign({}, SPECS, {
      [RESEARCH]: {
        unit_types: T("Basic Construction Factory Land Structure Tank Custom7"),
        buildable_types: "(Custom7 & FactoryBuild & Basic & Tank) - Mobile",
      },
      [TOKEN]: {
        unit_types: T("Basic Land Structure Tank FactoryBuild Custom7"),
      },
    });
    const units = UNITS.concat([RESEARCH, TOKEN]);
    const v = cells.buildIndex(units, specs, cells.vanillaMember);
    const r = cells.buildIndex(units, specs, cells.raceMember("Custom7"));

    assert.deepEqual(cells.cardUnitsFor([FACTORY], v, r), [
      FX_FACTORY,
      RESEARCH,
    ]);
  });

  it("does not mutate the list it is given", () => {
    const original = [ANT, COMMANDER];
    cells.cardUnitsFor(original, vanilla, race);
    assert.deepEqual(original, [ANT, COMMANDER]);
  });
});

describe("unitMapFallback", () => {
  it("re-points a vanilla spec_id the race maps did not set to the first race unit it stands for", () => {
    const map = {
      unit_map: {
        Tank: { spec_id: ANT },
        Scout: { spec_id: SKITTER },
        LandScout: { spec_id: SKITTER },
        Bot: { spec_id: DOX },
        Foreign: { spec_id: "/pa/units/x/x.json" },
        Type: { unit_types: "Tank & Custom7" },
      },
      other: true,
    };
    const raceMaps = [
      { unit_map: { Scout: { spec_id: "/pa/units/r/r.json" } } },
      undefined,
    ];

    assert.deepEqual(cells.unitMapFallback(map, raceMaps, vanilla, race), {
      unit_map: {
        Tank: { spec_id: FX_TANK },
        Scout: { spec_id: SKITTER },
        // Stands for nothing, so it stays, and the army never builds it.
        LandScout: { spec_id: SKITTER },
        Bot: { spec_id: DOX },
        Foreign: { spec_id: "/pa/units/x/x.json" },
        Type: { unit_types: "Tank & Custom7" },
      },
      other: true,
    });
    assert.equal(map.unit_map.Tank.spec_id, ANT);
    assert.equal(
      cells.unitMapFallback(undefined, [], vanilla, race),
      undefined
    );
  });
});

describe("exclusive units and add-ons", () => {
  const FABBER_ADV =
    "/pa/units/land/fabrication_bot_adv/fabrication_bot_adv.json";
  const FX_FABBER_ADV = "/pa/units/land/rx_fabber_adv/rx_fabber_adv.json";
  const ADDON_TANK = "/pa/units/addon/rex/rex.json";
  const ADDON_TANK_WEAPON = "/pa/units/addon/rex/rex_tool_weapon.json";
  const ADDON_TANK_AMMO = "/pa/units/addon/rex/rex_ammo.json";
  const GANTRY = "/pa/units/addon/gantry/gantry.json";
  const GANTRY_FX = "/pa/units/addon/rx_gantry/rx_gantry.json";
  const EXCLUSIVE = "/pa/units/addon/big/big.json";
  const LARVA = "/pa/units/addon/larva/larva.json";
  const FX_TOWER = "/pa/units/addon/rx_tower/rx_tower.json";
  const specs = Object.assign({}, SPECS, {
    [FABBER_ADV]: {
      unit_types: T("Advanced Bot Construction Fabber Land Mobile Custom58"),
      buildable_types: "FabAdvBuild & Custom58",
    },
    [FX_FABBER_ADV]: {
      unit_types: T("Advanced Bot Construction Fabber Land Mobile Custom7"),
      buildable_types: "FabAdvBuild & Custom7",
    },
    [ADDON_TANK]: {
      unit_types: T("Basic Land Mobile Offense Tank Custom58 FactoryBuild"),
      tools: [{ spec_id: ADDON_TANK_WEAPON }],
    },
    [ADDON_TANK_WEAPON]: { ammo_id: ADDON_TANK_AMMO },
    [ADDON_TANK_AMMO]: { damage: 11 },
    // The gantries sit in a cell no vanilla unit fills and build Custom17.
    [GANTRY]: {
      unit_types: T(
        "Factory Construction Structure Important FabAdvBuild Custom58"
      ),
      buildable_types: "Mobile & FactoryBuild & Custom17",
    },
    [GANTRY_FX]: {
      unit_types: T(
        "Factory Construction Structure Important FabAdvBuild Custom7"
      ),
      buildable_types: "Mobile & FactoryBuild & Custom17",
    },
    [EXCLUSIVE]: {
      unit_types: T("Advanced Land Mobile Offense Tank FactoryBuild Custom17"),
    },
    // A NoBuild vanilla spec alone in its cell, and a race unit there.
    [LARVA]: { unit_types: T("Offense Advanced Deconstruction NoBuild Hover") },
    [FX_TOWER]: { unit_types: T("Advanced Structure FabAdvBuild Custom7") },
  });
  const units = UNITS.concat([
    FABBER_ADV,
    FX_FABBER_ADV,
    ADDON_TANK,
    GANTRY,
    GANTRY_FX,
    EXCLUSIVE,
    LARVA,
    FX_TOWER,
  ]);
  const addonPaths = {
    [ADDON_TANK]: true,
    [GANTRY]: true,
    [EXCLUSIVE]: true,
  };
  const exclusive = cells.exclusiveMember(["Custom58", "Custom7"]);
  // As race_cells.js builds them: the base game's units on the vanilla side,
  // never an add-on's, so the gantry's cell reads as unfilled.
  const v = cells.buildIndex(
    units,
    specs,
    (types, path) => cells.vanillaMember(types) && !addonPaths[path]
  );
  const r = cells.buildIndex(
    units,
    specs,
    cells.raceMember("Custom7"),
    exclusive
  );
  const a = cells.buildIndex(
    units,
    specs,
    (types, path) => cells.vanillaMember(types) && !!addonPaths[path],
    exclusive
  );

  it("marks a unit under a bit nothing owns exclusive", () => {
    assert.equal(exclusive(T("Bot Custom17")), true);
    assert.equal(exclusive(T("Bot Custom7 Custom17")), false);
    assert.equal(exclusive(T("Bot Custom58")), false);
    assert.equal(exclusive(T("Bot")), false);
    assert.equal(cells.exclusiveMember(undefined)(T("Bot Custom17")), true);
  });

  it("indexes an exclusive unit apart from the members, in every index", () => {
    for (const index of [r, a]) {
      assert.equal(index.exclusive[EXCLUSIVE], true);
      assert.equal(index.cellOf[EXCLUSIVE], "Vehicle/Advanced/Combat");
      assert.ok(!index.units.includes(EXCLUSIVE));
      assert.equal(index.unitsByCell["Vehicle/Advanced/Combat"], undefined);
    }
    assert.deepEqual(v.exclusive, {});
    assert.equal(v.cellOf[EXCLUSIVE], undefined);
    // The add-on index holds the add-on's vanilla-typed units alone, and the
    // vanilla index none of them.
    assert.deepEqual(a.units, [ADDON_TANK, GANTRY]);
    assert.equal(a.cellOf[ANT], undefined);
    assert.equal(v.cellOf[GANTRY], undefined);
    assert.equal(v.unitsByCell["Land/Basic/Factory"], undefined);
  });

  it("grants an exclusive unit only through a builder, whatever its cell holds", () => {
    // The race's advanced fabber (by cell) builds the race's gantry (an
    // orphan), which builds the exclusive.
    assert.deepEqual(cells.raceUnitsFor([FABBER_ADV], v, r), [
      FX_FABBER_ADV,
      GANTRY_FX,
      FX_TOWER,
      EXCLUSIVE,
    ]);
    assert.deepEqual(cells.raceUnitsFor([ANT], v, r), [FX_TANK]);
    // Never a cell grant, and never a mod target.
    assert.deepEqual(cells.cardUnitsFor([ANT], v, r), [FX_TANK]);
    assert.equal(cells.cardUsable([EXCLUSIVE], v, r), false);
    const mod = { file: ANT, path: "max_health", op: "multiply", value: 2 };
    assert.deepEqual(cells.expandMods([mod], v, r), [
      Object.assign({}, mod, { file: FX_TANK }),
    ]);
  });

  it("treats a cell held only by NoBuild vanilla specs as unfilled", () => {
    assert.deepEqual(v.unitsByCell["Land/Advanced/Structure"], [LARVA]);
    assert.ok(cells.raceUnitsFor([FABBER_ADV], v, r).includes(FX_TOWER));
    // A cell with a buildable vanilla occupant is still filled.
    assert.ok(!cells.raceUnitsFor([FACTORY], v, r).includes(FX_TANK));
  });

  describe("a vanilla unit whose only type is its faction bit", () => {
    // The Deep Space Radar's stub: classify puts it in the basic fabrication
    // tower's cell, where it is the only buildable vanilla occupant.
    const RADAR = "/pa/units/orbital/deep_space_radar/deep_space_radar.json";
    const FABBER = "/pa/units/land/fabrication_bot/fabrication_bot.json";
    const FX_FABBER = "/pa/units/land/rx_fabber/rx_fabber.json";
    const TOWER = "/pa/units/addon/fab_tower/fab_tower.json";
    const FX_FAB_TOWER = "/pa/units/rx_addon/fab_tower/fab_tower.json";
    const stubSpecs = Object.assign({}, specs, {
      [RADAR]: { unit_types: T("Custom58") },
      [FABBER]: {
        unit_types: T("Basic Bot Construction Fabber Land Mobile Custom58"),
        buildable_types: "FabBuild & Custom58",
      },
      [FX_FABBER]: {
        unit_types: T("Basic Bot Construction Fabber Land Mobile Custom7"),
        buildable_types: "FabBuild & Custom7",
      },
      [TOWER]: { unit_types: T("Basic Structure FabBuild Custom58") },
      [FX_FAB_TOWER]: { unit_types: T("Basic Structure FabBuild Custom7") },
    });
    const stubUnits = units.concat([
      RADAR,
      FABBER,
      FX_FABBER,
      TOWER,
      FX_FAB_TOWER,
    ]);
    const vanillaSide = (classifiableOnly) =>
      cells.buildIndex(
        stubUnits,
        stubSpecs,
        (types, path) =>
          cells.vanillaMember(types) &&
          (!classifiableOnly || cells.classifiable(types)) &&
          !addonPaths[path] &&
          path !== TOWER
      );
    const race = cells.buildIndex(
      stubUnits,
      stubSpecs,
      cells.raceMember("Custom7"),
      exclusive
    );
    const addon = cells.buildIndex(
      stubUnits,
      stubSpecs,
      (types, path) => cells.vanillaMember(types) && path === TOWER,
      exclusive
    );

    it("is not classifiable", () => {
      assert.equal(cells.classifiable(T("Custom58")), false);
      assert.equal(cells.classifiable(T("Custom58 FabBuild NoBuild")), false);
      assert.equal(cells.classifiable(undefined), false);
      assert.equal(cells.classifiable(T("Structure Custom58")), true);
      // classify still files it by its defaults.
      assert.equal(cells.classify(T("Custom58")).key, "Land/Basic/Structure");
    });

    it("fills the tower's cell when indexed, so no tower is reached", () => {
      const filled = vanillaSide(false);
      assert.deepEqual(filled.unitsByCell["Land/Basic/Structure"], [RADAR]);
      assert.ok(
        !cells.raceUnitsFor([FABBER], filled, race).includes(FX_FAB_TOWER)
      );
      assert.ok(!cells.addonUnitsFor([FABBER], filled, addon).includes(TOWER));
    });

    it("left out of the vanilla side, lets a held fabber build the tower", () => {
      const vanilla = vanillaSide(true);
      assert.equal(vanilla.cellOf[RADAR], undefined);
      assert.deepEqual(cells.raceUnitsFor([FABBER], vanilla, race), [
        FX_FABBER,
        FX_FAB_TOWER,
      ]);
      assert.deepEqual(cells.addonUnitsFor([FABBER], vanilla, addon), [
        FABBER,
        TOWER,
      ]);
      // A mod on the stub stays on it rather than landing on the towers.
      const mod = { file: RADAR, path: "max_health", op: "multiply", value: 2 };
      assert.deepEqual(
        cells.expandMods([mod], vanilla, race, () => true),
        [mod]
      );
      assert.deepEqual(
        cells.expandMods([mod], vanilla, addon, () => true),
        [mod]
      );
    });
  });

  describe("addonUnitsFor", () => {
    it("keeps everything held and adds the add-on units of the held cells", () => {
      assert.deepEqual(cells.addonUnitsFor([ANT, ANT, DOX], v, a), [
        ANT,
        DOX,
        ADDON_TANK,
      ]);
      assert.deepEqual(cells.addonUnitsFor(undefined, v, a), []);
    });

    it("reaches an orphan through a held vanilla builder, and the exclusive through it", () => {
      assert.deepEqual(cells.addonUnitsFor([FABBER_ADV], v, a), [
        FABBER_ADV,
        GANTRY,
        EXCLUSIVE,
      ]);
      // An orphan nothing held can build stays out.
      assert.deepEqual(cells.addonUnitsFor([ANT], v, a), [ANT, ADDON_TANK]);
    });

    it("keeps held parts, commander-class units and foreign paths", () => {
      assert.deepEqual(
        cells.addonUnitsFor(
          [ANT_AMMO, COMMANDER, COLONEL, "/pa/units/mod/x.json"],
          v,
          a
        ),
        [ANT_AMMO, COMMANDER, COLONEL, "/pa/units/mod/x.json"]
      );
    });
  });

  it("lists a card's own units and the add-on units of their cells", () => {
    assert.deepEqual(cells.addonCardUnitsFor([ANT, DOX], v, a), [
      ANT,
      DOX,
      ADDON_TANK,
    ]);
    assert.deepEqual(cells.addonCardUnitsFor([COMMANDER], v, a), [COMMANDER]);
    assert.deepEqual(cells.addonCardUnitsFor(undefined, v, a), []);
  });

  it("lands a mod on the add-on cell-mates beside the original the army holds", () => {
    const mod = { file: ANT_AMMO, path: "damage", op: "multiply", value: 2 };
    assert.deepEqual(
      cells.expandMods([mod], v, a, () => true),
      [mod, Object.assign({}, mod, { file: ADDON_TANK_AMMO })]
    );
  });
});

describe("unitMapFallback with avoid", () => {
  // Sorts before /pa/units/land/, so it would be stand[0].
  const EARLY_TANK = "/pa/units/l_addon/a_tank/a_tank.json";
  const specs = Object.assign({}, SPECS, {
    [EARLY_TANK]: { unit_types: T("Basic Land Mobile Offense Tank Custom7") },
  });
  const units = UNITS.concat([EARLY_TANK]);
  const v = cells.buildIndex(units, specs, cells.vanillaMember);
  const r = cells.buildIndex(units, specs, cells.raceMember("Custom7"));
  const map = { unit_map: { Tank: { spec_id: ANT } } };

  it("prefers the first unit not avoided, and falls back to the first of the cell", () => {
    assert.deepEqual(r.unitsByCell["Vehicle/Basic/Combat"], [
      EARLY_TANK,
      FX_TANK,
    ]);
    assert.equal(
      cells.unitMapFallback(map, [], v, r).unit_map.Tank.spec_id,
      EARLY_TANK
    );
    assert.equal(
      cells.unitMapFallback(map, [], v, r, { [EARLY_TANK]: true }).unit_map.Tank
        .spec_id,
      FX_TANK
    );
    assert.equal(
      cells.unitMapFallback(map, [], v, r, {
        [EARLY_TANK]: true,
        [FX_TANK]: true,
      }).unit_map.Tank.spec_id,
      EARLY_TANK
    );
  });
});

describe("jobs", () => {
  const V = (name) => "/pa/units/land/v_" + name + "/v_" + name + ".json";
  const R = (name) => "/pa/units/land/r_" + name + "/r_" + name + ".json";
  const WEAPON = (unit) => unit.replace(/\.json$/, "_tool_weapon.json");
  const AMMO = (unit) => unit.replace(/\.json$/, "_ammo.json");
  const mod = (file, path, value) => ({ file, path, op: "multiply", value });

  // Basic tanks, each with its own weapon and ammo, the vanilla ones named
  // by v_, the race's (Custom7) by r_. The commander builds the factory and
  // the factory every vanilla tank typed FactoryBuild. `tweak` edits the
  // specs before they are indexed.
  const indexes = (vanillaTypes, raceTypes, tweak) => {
    const specs = {
      [COMMANDER]: {
        unit_types: T("Commander Construction Land Mobile Custom58"),
        buildable_types: "CmdBuild & Custom58",
      },
      [FACTORY]: {
        unit_types: T(
          "Basic Construction Factory Land Structure Tank CmdBuild Custom58"
        ),
        buildable_types: "FactoryBuild & Custom58",
      },
    };
    const add = (unit, types) => {
      specs[unit] = {
        unit_types: T("Basic Land Mobile Offense Tank " + types),
        tools: [{ spec_id: WEAPON(unit) }],
      };
      specs[WEAPON(unit)] = { ammo_id: AMMO(unit) };
      specs[AMMO(unit)] = {};
    };
    for (const [name, types] of Object.entries(vanillaTypes)) {
      add(V(name), ("Custom58 " + types).trim());
    }
    for (const [name, types] of Object.entries(raceTypes)) {
      add(R(name), ("Custom7 " + types).trim());
    }
    if (tweak) {
      tweak(specs);
    }
    const units = Object.keys(specs).filter((unit) =>
      /\/([^/]+)\/\1\.json$/.test(unit)
    );
    const v = cells.buildIndex(units, specs, cells.vanillaMember);
    const r = cells.buildIndex(units, specs, cells.raceMember("Custom7"));
    return { v, r, standIns: cells.standInsFor(v, r) };
  };

  it("reads a mobile combat unit's jobs in table order, Recon as Scout", () => {
    const jobs = (list) => cells.classify(T(list)).jobs;

    assert.deepEqual(jobs("Basic Land Mobile Offense Tank Hover Artillery"), [
      "Artillery",
      "Hover",
    ]);
    assert.deepEqual(jobs("Advanced Air Mobile Offense Bomber Heavy"), [
      "Heavy",
      "Bomber",
    ]);
    assert.deepEqual(jobs("Basic Air Mobile Offense Recon Scout"), ["Scout"]);
    assert.deepEqual(jobs("Basic Orbital Mobile Recon"), ["Scout"]);
    assert.deepEqual(jobs("Basic Land Mobile Offense Tank"), []);
    // Combat cells only.
    assert.deepEqual(jobs("Basic AirDefense Defense Land Structure"), []);
    assert.deepEqual(jobs("Basic Bot Construction Fabber Land Mobile"), []);
    assert.deepEqual(jobs("Advanced Air Bomber Mobile Offense Titan"), []);
  });

  it("gives a race unit to the vanilla units that share its first shared job", () => {
    // Artillery is no vanilla unit's job, so the Corsair-like tank goes to
    // the hover tank.
    const { standIns } = indexes(
      {
        plain: "FactoryBuild",
        aa: "FactoryBuild AirDefense",
        hover: "FactoryBuild Hover",
      },
      { aa: "AirDefense", corsair: "Artillery Hover", plain: "" }
    );

    assert.deepEqual(standIns(V("aa")), [R("aa")]);
    assert.deepEqual(standIns(V("hover")), [R("corsair")]);
    assert.deepEqual(standIns(V("plain")), [R("plain")]);
  });

  it("homes a race unit no job matches on the job-less vanilla units", () => {
    // The amphibious tank has a job, but no vanilla unit shares it.
    const { standIns } = indexes(
      { plain: "FactoryBuild", aa: "FactoryBuild AirDefense" },
      { aa: "AirDefense", amphibious: "Amphibious", plain: "" }
    );

    assert.deepEqual(standIns(V("plain")), [R("amphibious"), R("plain")]);
    assert.deepEqual(standIns(V("aa")), [R("aa")]);
  });

  it("with no job-less vanilla unit, homes it on those whose job no race unit shares", () => {
    const { standIns } = indexes(
      {
        aa: "FactoryBuild AirDefense",
        artillery: "FactoryBuild Artillery",
        scout: "FactoryBuild Scout",
      },
      { aa: "AirDefense", plain: "" }
    );

    assert.deepEqual(standIns(V("aa")), [R("aa")]);
    assert.deepEqual(standIns(V("artillery")), [R("plain")]);
    assert.deepEqual(standIns(V("scout")), [R("plain")]);
  });

  it("with neither, homes it on every vanilla unit of the cell", () => {
    const { standIns } = indexes(
      { aa: "FactoryBuild AirDefense", artillery: "FactoryBuild Artillery" },
      { aa: "AirDefense", artillery: "Artillery", plain: "" }
    );

    assert.deepEqual(standIns(V("aa")), [R("aa"), R("plain")]);
    assert.deepEqual(standIns(V("artillery")), [R("artillery"), R("plain")]);
  });

  it("leaves a unit whose job no race unit shares, and no home, standing for nothing", () => {
    const { v, r, standIns } = indexes(
      { plain: "FactoryBuild", scout: "FactoryBuild Scout" },
      { plain: "" }
    );

    assert.deepEqual(standIns(V("scout")), []);
    assert.deepEqual(cells.raceUnitsFor([V("scout")], v, r), []);
    assert.deepEqual(cells.cardUnitsFor([V("scout")], v, r), []);
    assert.equal(cells.cardUsable([V("scout")], v, r), false);
    assert.deepEqual(
      cells.expandMods([mod(V("scout"), "max_health", 2)], v, r),
      []
    );
    assert.deepEqual(
      cells.unitMapFallback(
        {
          unit_map: {
            LandScout: { spec_id: V("scout") },
            Tank: { spec_id: V("plain") },
          },
        },
        [],
        v,
        r
      ).unit_map,
      {
        LandScout: { spec_id: V("scout") },
        Tank: { spec_id: R("plain") },
      }
    );
  });

  it("lets a unit no commander can build stand for its whole cell, and gives it no say in the jobs", () => {
    // The drone's Scout job is not counted, so the race scout is homed on
    // the anti-air tank, the only vanilla unit that counts.
    const { v, standIns } = indexes(
      { aa: "FactoryBuild AirDefense", drone: "Scout" },
      { aa: "AirDefense", scout: "Scout" }
    );

    assert.equal(v.fieldable[V("drone")], undefined);
    assert.deepEqual(standIns(V("drone")), [R("aa"), R("scout")]);
    assert.deepEqual(standIns(V("aa")), [R("aa"), R("scout")]);
  });

  it("keeps every cell whole when no commander has a build list", () => {
    const { v, standIns } = indexes(
      { plain: "FactoryBuild", aa: "FactoryBuild AirDefense" },
      { aa: "AirDefense", plain: "" },
      (specs) => {
        delete specs[COMMANDER].buildable_types;
      }
    );

    assert.deepEqual(v.fieldable, {});
    assert.deepEqual(standIns(V("aa")), [R("aa"), R("plain")]);
    assert.deepEqual(standIns(V("plain")), [R("aa"), R("plain")]);
  });

  it("lands a part mod on the same role under its owners' stand-ins", () => {
    // The shared tool sits in neither tank's directory, so it belongs to
    // both.
    const SHARED = "/pa/tools/shared_weapon.json";
    const { v, r } = indexes(
      { plain: "FactoryBuild", aa: "FactoryBuild AirDefense" },
      { aa: "AirDefense", plain: "" },
      (specs) => {
        specs[SHARED] = { ammo_id: "/pa/ammo/shared_ammo.json" };
        specs[V("plain")].tools.push({ spec_id: SHARED });
        specs[V("aa")].tools.push({ spec_id: SHARED });
      }
    );

    assert.deepEqual(v.partIndex[AMMO(V("aa"))], {
      role: "ammo",
      units: [V("aa")],
    });
    assert.deepEqual(v.partIndex[SHARED], {
      role: "weapon",
      units: [V("plain"), V("aa")],
    });
    assert.deepEqual(
      cells.expandMods([mod(AMMO(V("aa")), "damage", 2)], v, r),
      [mod(AMMO(R("aa")), "damage", 2)]
    );
    assert.deepEqual(
      cells.expandMods([mod(WEAPON(V("plain")), "rate_of_fire", 2)], v, r),
      [mod(WEAPON(R("plain")), "rate_of_fire", 2)]
    );
    assert.deepEqual(cells.expandMods([mod(SHARED, "rate_of_fire", 2)], v, r), [
      mod(WEAPON(R("plain")), "rate_of_fire", 2),
      mod(WEAPON(R("aa")), "rate_of_fire", 2),
    ]);
  });

  it("changes a race unit once for one card naming three of its homes, and twice for two copies", () => {
    const { v, r } = indexes(
      {
        aa: "FactoryBuild AirDefense",
        artillery: "FactoryBuild Artillery",
        hover: "FactoryBuild Hover",
        scout: "FactoryBuild Scout",
      },
      { aa: "AirDefense", plain: "" }
    );
    const homes = ["artillery", "hover", "scout"];
    const card = homes
      .map((name) => mod(V(name), "max_health", 1.25))
      .concat(homes.map((name) => mod(AMMO(V(name)), "damage", 1.25)));
    const once = [
      mod(R("plain"), "max_health", 1.25),
      mod(AMMO(R("plain")), "damage", 1.25),
    ];

    assert.deepEqual(cells.expandMods(card, v, r), once);
    assert.deepEqual(
      cells.expandMods(card.concat(card), v, r),
      once.concat(once)
    );
  });
});

describe("units a race builds itself", () => {
  const U = (dir, name) =>
    "/pa/units/" + dir + "/" + name + "/" + name + ".json";
  const SHIP = U("sea", "v_ship");
  const SHIP_AMMO = SHIP.replace(/\.json$/, "_ammo.json");
  const NAVAL_FACTORY = U("sea", "v_naval_factory");
  const ORBITAL_FABBER = U("orbital", "v_orbital_fabber");
  const ORBITAL_FACTORY = U("orbital", "v_orbital_factory");
  const AIR_SCOUT = U("air", "v_air_scout");
  const TANK = U("land", "v_tank");
  const R_COMMANDER = "/pa/units/commanders/r_commander/r_commander.json";
  const R_HIVE = U("sea", "r_hive");
  const R_LAUNCHER = U("orbital", "r_launcher");
  const R_TANK = U("land", "r_tank");
  const BARGE = U("sea", "v_barge");
  const MINE = U("land", "v_mine");
  const R_MINE = U("land", "r_mine");

  // The race's hive builds the vanilla ships and its launcher the vanilla
  // orbital fabber, which builds the vanilla orbital factory, as Bugs' naval
  // hives and Exiles' launcher do. Its commander also builds the vanilla
  // tank, whose cell holds a race tank. Nothing race-side builds the scout.
  const specs = {
    [COMMANDER]: {
      unit_types: T("Commander Construction Land Mobile Custom58"),
      buildable_types: "CmdBuild & Custom58",
    },
    [NAVAL_FACTORY]: {
      unit_types: T(
        "Basic Construction Factory Naval Structure CmdBuild Custom58"
      ),
      buildable_types: "Naval & FactoryBuild & Custom58",
    },
    [SHIP]: {
      unit_types: T("Basic Naval Mobile Offense FactoryBuild Custom58"),
      tools: [{ spec_id: SHIP.replace(/\.json$/, "_tool_weapon.json") }],
    },
    [SHIP.replace(/\.json$/, "_tool_weapon.json")]: { ammo_id: SHIP_AMMO },
    [SHIP_AMMO]: {},
    [ORBITAL_FABBER]: {
      unit_types: T("Basic Orbital Mobile Construction Fabber Custom58"),
      buildable_types: "Orbital & Structure & Custom58",
    },
    [ORBITAL_FACTORY]: {
      unit_types: T("Advanced Orbital Structure Factory Construction Custom58"),
    },
    [AIR_SCOUT]: {
      unit_types: T("Basic Air Mobile Offense Scout FactoryBuild Custom58"),
    },
    [TANK]: {
      unit_types: T("Basic Land Mobile Offense Tank FactoryBuild Custom58"),
    },
    [R_COMMANDER]: {
      unit_types: T("Commander Construction Land Mobile Custom7"),
      buildable_types: "(CmdBuild & Custom7) | (Tank & Custom58)",
    },
    [R_HIVE]: {
      unit_types: T(
        "Basic Construction Factory Naval Structure CmdBuild Custom7"
      ),
      buildable_types: "Naval & Mobile & Custom58",
    },
    [R_LAUNCHER]: {
      unit_types: T(
        "Basic Construction Factory Orbital Structure CmdBuild Custom7"
      ),
      buildable_types: "Orbital & Mobile & Custom58",
    },
    [R_TANK]: { unit_types: T("Basic Land Mobile Offense Tank Custom7") },
    // The hive also builds the vanilla barge, whose only target, the mine,
    // stands for the race's mine, as MLA's barge does in a Bugs army.
    [BARGE]: {
      unit_types: T("Basic Naval Mobile Fabber Custom58"),
      buildable_types: "CombatFabBuild & Custom58",
    },
    [MINE]: {
      unit_types: T("Basic Land Structure Defense CombatFabBuild Custom58"),
    },
    [R_MINE]: {
      unit_types: T("Basic Land Structure Defense CombatFabBuild Custom7"),
    },
  };
  const units = Object.keys(specs).filter((unit) =>
    /\/([^/]+)\/\1\.json$/.test(unit)
  );
  const v = cells.buildIndex(units, specs, cells.vanillaMember);
  const r = cells.buildIndex(units, specs, cells.raceMember("Custom7"));
  const standIns = cells.standInsFor(v, r);
  const mod = (file) => ({
    file,
    path: "max_health",
    op: "multiply",
    value: 2,
  });

  it("lets a unit the race builds, and that stands for no race unit, stand for itself", () => {
    assert.deepEqual(standIns(SHIP), [SHIP]);
    assert.deepEqual(standIns(NAVAL_FACTORY), [R_HIVE]);
  });

  it("fields it only when held", () => {
    assert.deepEqual(cells.raceUnitsFor([NAVAL_FACTORY, SHIP], v, r), [
      R_HIVE,
      SHIP,
    ]);
    assert.deepEqual(cells.raceUnitsFor([NAVAL_FACTORY], v, r), [R_HIVE]);
  });

  it("deals a card that names it, and lists it in the tooltip", () => {
    assert.equal(cells.cardUsable([SHIP], v, r), true);
    assert.deepEqual(cells.cardUnitsFor([SHIP], v, r), [SHIP]);
  });

  it("lands a mod on it once when held, and never when not", () => {
    assert.deepEqual(
      cells.expandMods([mod(SHIP)], v, r, () => true),
      [mod(SHIP)]
    );
    assert.deepEqual(
      cells.expandMods([mod(SHIP)], v, r, () => false),
      []
    );
    assert.deepEqual(
      cells.expandMods([mod(SHIP_AMMO)], v, r, () => true),
      [mod(SHIP_AMMO)]
    );
    assert.deepEqual(
      cells.expandMods([mod(SHIP_AMMO)], v, r, () => false),
      []
    );
  });

  it("follows a kept vanilla builder, as a skirmish does", () => {
    assert.deepEqual(standIns(ORBITAL_FABBER), [ORBITAL_FABBER]);
    assert.deepEqual(standIns(ORBITAL_FACTORY), [ORBITAL_FACTORY]);
  });

  it("does not field a builder that would build nothing the army fields", () => {
    assert.deepEqual(standIns(MINE), [R_MINE]);
    assert.deepEqual(standIns(BARGE), []);
  });

  it("does not let a unit that stands for race units also stand for itself", () => {
    assert.deepEqual(standIns(TANK), [R_TANK]);
  });

  it("leaves a unit the race cannot build standing for nothing", () => {
    assert.deepEqual(standIns(AIR_SCOUT), []);
    assert.equal(cells.cardUsable([AIR_SCOUT], v, r), false);
  });
});

describe("buildableStockUnits", () => {
  const U = (dir, name) =>
    "/pa/units/" + dir + "/" + name + "/" + name + ".json";
  const R_COMMANDER = "/pa/units/commanders/r_commander/r_commander.json";
  const R_LAUNCHER = U("orbital", "r_launcher");
  const R_TELEPORTER = U("land", "r_teleporter");
  const ORBITAL_FABBER = U("orbital", "v_orbital_fabber");
  const ORBITAL_FACTORY = U("orbital", "v_orbital_factory");
  const TELEPORTER = U("land", "v_teleporter");
  const COLONEL = U("land", "v_colonel");

  // The race's launcher builds the vanilla orbital fabber, which builds the
  // vanilla orbital factory and the vanilla teleporter, whose cell holds the
  // race's teleporter, as Exiles' launcher does. The colonel is a kept
  // vanilla commander-class unit whose build list still names vanilla
  // structures.
  const specs = {
    [R_COMMANDER]: {
      unit_types: T("Commander Construction Land Mobile Custom7"),
      buildable_types: "CmdBuild & Custom7",
    },
    [R_LAUNCHER]: {
      unit_types: T(
        "Basic Construction Factory Orbital Structure CmdBuild Custom7"
      ),
      buildable_types: "Orbital & Mobile & Custom58",
    },
    [R_TELEPORTER]: {
      unit_types: T("Basic Land Structure Teleporter CmdBuild Custom7"),
    },
    [ORBITAL_FABBER]: {
      unit_types: T("Basic Orbital Mobile Construction Fabber Custom58"),
      buildable_types: "FabOrbBuild & Custom58",
    },
    [ORBITAL_FACTORY]: {
      unit_types: T(
        "Advanced Orbital Structure Factory Construction FabOrbBuild Custom58"
      ),
    },
    [TELEPORTER]: {
      unit_types: T(
        "Basic Land Structure Teleporter FabBuild FabOrbBuild Custom58"
      ),
    },
    [COLONEL]: {
      unit_types: T(
        "SupportCommander Advanced Bot Mobile Construction Custom58"
      ),
      buildable_types: "FabBuild & Custom58",
    },
  };
  const units = Object.keys(specs);
  const v = cells.buildIndex(units, specs, cells.vanillaMember);
  const r = cells.buildIndex(units, specs, cells.raceMember("Custom7"));
  const fielded = (held, stock) =>
    cells.buildableStockUnits(
      cells.raceUnitsFor(held, v, r),
      held,
      stock,
      v,
      r
    );

  it("adds a held stock unit that something fielded can build, beside the race unit it stands for", () => {
    assert.deepEqual(fielded([ORBITAL_FABBER, TELEPORTER], [TELEPORTER]), [
      ORBITAL_FABBER,
      R_TELEPORTER,
      TELEPORTER,
    ]);
  });

  it("leaves out a stock unit that is not held", () => {
    assert.deepEqual(fielded([ORBITAL_FABBER], [TELEPORTER]), [ORBITAL_FABBER]);
  });

  it("leaves out a stock unit that nothing fielded can build", () => {
    assert.deepEqual(fielded([TELEPORTER], [TELEPORTER]), [R_TELEPORTER]);
  });

  it("reads each builder's own list, so a kept vanilla commander-class unit counts", () => {
    assert.deepEqual(fielded([COLONEL, TELEPORTER], [TELEPORTER]), [
      COLONEL,
      R_TELEPORTER,
      TELEPORTER,
    ]);
  });

  it("adds nothing without stock units, never a unit twice or a path outside the vanilla index, and leaves its input alone", () => {
    const held = [ORBITAL_FABBER, TELEPORTER];
    const base = [ORBITAL_FABBER, R_TELEPORTER, TELEPORTER];

    assert.deepEqual(cells.buildableStockUnits(base, held, [], v, r), base);
    assert.deepEqual(
      cells.buildableStockUnits(base, held, undefined, v, r),
      base
    );
    assert.deepEqual(
      cells.buildableStockUnits(
        base,
        held.concat(R_TELEPORTER),
        [TELEPORTER, R_TELEPORTER],
        v,
        r
      ),
      base
    );
    assert.deepEqual(
      cells.buildableStockUnits(
        [ORBITAL_FABBER],
        undefined,
        [TELEPORTER],
        v,
        r
      ),
      [ORBITAL_FABBER]
    );
    const input = [ORBITAL_FABBER];
    cells.buildableStockUnits(input, held, [TELEPORTER], v, r);
    assert.deepEqual(input, [ORBITAL_FABBER]);
  });
});
