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

// Vanilla ant and dox with their weapon/ammo chains, a factory, a commander
// and a race (Custom7) counterpart of each, so every rule has both sides.
const ANT = "/pa/units/land/tank_light_laser/tank_light_laser.json";
const ANT_WEAPON =
  "/pa/units/land/tank_light_laser/tank_light_laser_tool_weapon.json";
const ANT_AMMO = "/pa/units/land/tank_light_laser/tank_light_laser_ammo.json";
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
const FX_TANK = "/pa/units/land/fx_tank/fx_tank.json";
const FX_TANK_WEAPON = "/pa/units/land/fx_tank/fx_tank_tool_weapon.json";
const FX_TANK_AMMO = "/pa/units/land/fx_tank/fx_tank_ammo.json";
const FX_TANK2 = "/pa/units/land/fx_tank2/fx_tank2.json";
const FX_TANK2_AMMO = "/pa/units/land/fx_tank2/fx_tank2_ammo.json";
const FX_FACTORY = "/pa/units/land/fx_vehicle_factory/fx_vehicle_factory.json";
const FX_FACTORY_ARM =
  "/pa/units/land/fx_vehicle_factory/fx_vehicle_factory_build_arm.json";
const FX_COMMANDER = "/pa/units/commanders/fx_alpha/fx_alpha.json";
const FX_COMMANDER_AMMO = "/pa/units/commanders/fx_alpha/fx_alpha_ammo.json";

const SPECS = {
  [BASE_VEHICLE]: { unit_types: T("Land Mobile Tank NoBuild") },
  [ANT]: {
    base_spec: BASE_VEHICLE,
    unit_types: T("Basic Land Mobile Offense Tank Custom58 FactoryBuild"),
    tools: [{ spec_id: ANT_WEAPON }],
  },
  [ANT_WEAPON]: { ammo_id: ANT_AMMO },
  [ANT_AMMO]: { damage: 10 },
  [SKITTER]: {
    base_spec: BASE_VEHICLE,
    unit_types: T("Basic Land Mobile Offense Scout Tank Vehicle Custom58"),
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
    unit_types: T("Basic Construction Factory Land Structure Tank Custom58"),
    tools: [{ spec_id: FACTORY_ARM }],
  },
  [FACTORY_ARM]: { construction_demand: { metal: 10 } },
  [COMMANDER]: { unit_types: T("Commander Construction Land Mobile Custom58") },
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
  [FX_TANK_WEAPON]: { base_spec: "/pa/tools/fx_base_weapon.json" },
  "/pa/tools/fx_base_weapon.json": { ammo_id: FX_TANK_AMMO },
  [FX_TANK_AMMO]: { damage: 12 },
  [FX_TANK2]: {
    base_spec: BASE_VEHICLE,
    tools: [{ spec_id: "/pa/units/land/fx_tank2/fx_tank2_tool_weapon.json" }],
  },
  "/pa/units/land/fx_tank2/fx_tank2_tool_weapon.json": {
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
      { spec_id: "/pa/units/commanders/fx_alpha/fx_alpha_tool_weapon.json" },
    ],
  },
  "/pa/units/commanders/fx_alpha/fx_alpha_tool_weapon.json": {
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
  it("keeps the members only, cells them, and indexes parts by role and cell", () => {
    // No faction bit at all reads as vanilla, base specs included.
    assert.deepEqual(vanilla.units, [
      BASE_VEHICLE,
      ANT,
      SKITTER,
      DOX,
      FACTORY,
      COMMANDER,
      COLONEL,
      FX_TANK2,
    ]);
    assert.deepEqual(vanilla.unitsByCell["Vehicle/Basic/Combat"], [
      BASE_VEHICLE,
      FX_TANK2,
      SKITTER,
      ANT,
    ]);
    assert.equal(vanilla.cellOf[DOX], "Bot/Basic/Combat");
    assert.deepEqual(vanilla.partIndex[ANT_AMMO], {
      role: "ammo",
      cells: ["Vehicle/Basic/Combat"],
    });
    assert.deepEqual(vanilla.partIndex[FACTORY_ARM], {
      role: "buildArm",
      cells: ["Vehicle/Basic/Factory"],
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

  it("tells vanilla from a race by faction bit", () => {
    assert.equal(cells.vanillaMember(T("Bot Custom58")), true);
    assert.equal(cells.vanillaMember(T("Bot")), true);
    assert.equal(cells.vanillaMember(T("Bot Custom1")), false);
    assert.equal(cells.raceMember("Custom1")(T("Bot Custom1")), true);
    assert.equal(cells.raceMember("Custom1")(T("Bot Custom58")), false);
  });
});

describe("raceUnitsFor", () => {
  it("grants the race's units of every held cell and passes the rest through", () => {
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

  it("lands a unit mod on the race units of the cell and a part mod on the race parts of the role", () => {
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

  it("applies a group card once per pass, and stacks a second card", () => {
    const oneCard = [
      mod(ANT_AMMO, "damage", 1.25),
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
          mod(SKITTER_AMMO, "damage", 2),
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
    const FX_BOT = "/pa/units/land/fx_bot/fx_bot.json";
    const FX_BOT_AMMO = "/pa/units/land/fx_bot/fx_bot_ammo.json";
    const FX_BOT2 = "/pa/units/land/fx_bot2/fx_bot2.json";
    const FX_BOT2_AMMO = "/pa/units/land/fx_bot2/fx_bot2_ammo.json";
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
        tools: [{ spec_id: "/pa/units/land/fx_bot/fx_bot_tool.json" }],
      },
      "/pa/units/land/fx_bot/fx_bot_tool.json": { ammo_id: FX_BOT_AMMO },
      [FX_BOT_AMMO]: {},
      [FX_BOT2]: {
        unit_types: T("Basic Bot Land Mobile Offense Custom7"),
        tools: [{ spec_id: "/pa/units/land/fx_bot2/fx_bot2_tool.json" }],
      },
      "/pa/units/land/fx_bot2/fx_bot2_tool.json": { ammo_id: FX_BOT2_AMMO },
      [FX_BOT2_AMMO]: {},
    });
    const units = UNITS.concat([SHARED_TANK, FX_BOT, FX_BOT2]);
    const v = cells.buildIndex(units, specs, cells.vanillaMember);
    const r = cells.buildIndex(units, specs, cells.raceMember("Custom7"));

    assert.deepEqual(v.partIndex[DOX_AMMO].cells, ["Bot/Basic/Combat"]);
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

  it("does not mutate the descriptors it is given", () => {
    const original = mod(ANT, "max_health", 2);
    cells.expandMods([original], vanilla, race);
    assert.equal(original.file, ANT);
  });
});

describe("cardUsable", () => {
  it("is true when the race owns something in a cell the card names", () => {
    assert.equal(cells.cardUsable([ANT, DOX], vanilla, race), true);
    assert.equal(cells.cardUsable([DOX], vanilla, race), false);
    assert.equal(
      cells.cardUsable(["/pa/units/mod/x.json"], vanilla, race),
      false
    );
    assert.equal(cells.cardUsable([], vanilla, race), false);
  });
});

describe("unitMapFallback", () => {
  it("re-points a vanilla spec_id the race maps did not set to the first race unit of its cell", () => {
    const map = {
      unit_map: {
        Tank: { spec_id: ANT },
        Scout: { spec_id: SKITTER },
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
