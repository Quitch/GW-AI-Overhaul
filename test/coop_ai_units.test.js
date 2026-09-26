"use strict";

// shared/coop_ai_units.js: what a co-op AI player's units are, from the specs
// or, without them, from unit-group membership. See tech-cards.md, "How AI
// players judge a card".

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const coopAiUnits = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/coop_ai_units.js"
);
const groups = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js"
);
const gwoUnit = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js"
);

const COMMANDER = "/pa/units/commanders/alpha/alpha.json";
const BOT_FACTORY = "/pa/units/land/bot_factory/bot_factory.json";
const BASE_BOT = "/pa/units/land/base_bot/base_bot.json";
const DOX = "/pa/units/land/dox/dox.json";
const DOX_WEAPON = "/pa/units/land/dox/dox_tool_weapon.json";
const DOX_AMMO = "/pa/units/land/dox/dox_ammo.json";
const BUMBLEBEE = "/pa/units/air/bumblebee/bumblebee.json";

const types = (...names) => names.map((name) => "UNITTYPE_" + name);

const SPECS = {
  [COMMANDER]: {
    unit_types: types("Commander", "Mobile", "Land"),
    buildable_types: "Factory & Basic",
  },
  [BOT_FACTORY]: {
    unit_types: types("Factory", "Structure", "Bot", "Basic"),
    buildable_types: "Bot & Mobile & Basic",
  },
  [BASE_BOT]: { unit_types: types("Mobile", "Bot", "Basic", "Offense") },
  [DOX]: {
    base_spec: BASE_BOT,
    tools: [{ spec_id: DOX_WEAPON }],
  },
  [DOX_WEAPON]: { ammo_id: DOX_AMMO },
  [DOX_AMMO]: {},
  [BUMBLEBEE]: { unit_types: types("Mobile", "Air", "Basic", "Offense") },
};

const lookup = coopAiUnits.fromSpecs({
  units: [COMMANDER, BOT_FACTORY, DOX, BUMBLEBEE],
  specs: SPECS,
});

// Commanders as TITANS ships them: most inherit the base commander whole,
// some redeclare its tools, and a race's builds only the race's units.
const BASE_COMMANDER = gwoUnit.commander;
const BASE_COMMANDER_WEAPON =
  "/pa/units/commanders/base_commander/base_commander_tool_bullet_weapon.json";
const BASE_COMMANDER_AMMO =
  "/pa/units/commanders/base_commander/base_commander_ammo_bullet.json";
const IMPERIAL = "/pa/units/commanders/imperial_able/imperial_able.json";
const QUAD = "/pa/units/commanders/quad_osiris/quad_osiris.json";
const QUAD_WEAPON =
  "/pa/units/commanders/base_commander/base_commander_tool_missile_weapon.json";
const RACE_COMMANDER = "/pa/units/commanders/l_cyclops/l_cyclops.json";
const NUKE = "/pa/ammo/nuke_pbaoe/nuke_pbaoe.json";

const COMMANDER_SPECS = Object.assign({}, SPECS, {
  [BASE_COMMANDER]: {
    unit_types: types("Custom58", "Commander", "Mobile", "Land"),
    buildable_types: "Factory & Basic",
    tools: [{ spec_id: BASE_COMMANDER_WEAPON }],
    death_weapon: { ground_ammo_spec: NUKE },
  },
  [NUKE]: {},
  [BASE_COMMANDER_WEAPON]: { ammo_id: BASE_COMMANDER_AMMO },
  [BASE_COMMANDER_AMMO]: {},
  [IMPERIAL]: { base_spec: BASE_COMMANDER },
  [QUAD]: { base_spec: BASE_COMMANDER, tools: [{ spec_id: QUAD_WEAPON }] },
  [QUAD_WEAPON]: {},
  [RACE_COMMANDER]: {
    unit_types: types("Custom1", "Commander", "Mobile", "Land"),
    buildable_types: "Custom1",
  },
});

const commanders = coopAiUnits.fromSpecs(
  {
    units: [BASE_COMMANDER, IMPERIAL, QUAD, RACE_COMMANDER, BOT_FACTORY, DOX],
    specs: COMMANDER_SPECS,
  },
  [BASE_COMMANDER, BOT_FACTORY, DOX, BUMBLEBEE]
);

describe("fromSpecs", () => {
  it("classifies a unit through its base_spec chain", () => {
    assert.deepEqual(lookup.classOf(DOX), {
      domain: "Bot",
      tier: "Basic",
      cls: "Combat",
      key: "Bot/Basic/Combat",
    });
    assert.equal(lookup.classOf(BOT_FACTORY).cls, "Factory");
    assert.equal(lookup.classOf("/pa/units/nowhere.json"), undefined);
    assert.equal(lookup.via, "specs");
  });

  it("finds the units a mod's file belongs to", () => {
    assert.deepEqual(lookup.ownersOf(DOX), [DOX]);
    assert.deepEqual(lookup.ownersOf(DOX_WEAPON), [DOX]);
    assert.deepEqual(lookup.ownersOf(DOX_AMMO), [DOX]);
    assert.deepEqual(lookup.ownersOf(BASE_BOT), [DOX]);
    // No unit carries it: the units of its directory.
    assert.deepEqual(lookup.ownersOf("/pa/units/land/dox/dox_extra.json"), [
      DOX,
    ]);
    assert.deepEqual(lookup.ownersOf("/pa/units/elsewhere/x.json"), []);
  });

  it("reaches what the commander builds, and what that builds", () => {
    assert.deepEqual(
      lookup.reachable([BOT_FACTORY, DOX, BUMBLEBEE], COMMANDER),
      [BOT_FACTORY, DOX]
    );
    assert.deepEqual(lookup.reachable([DOX, BUMBLEBEE], COMMANDER), []);
  });

  it("reaches everything held from a commander it does not know", () => {
    assert.deepEqual(
      lookup.reachable([DOX, BUMBLEBEE], "/pa/units/commanders/unknown.json"),
      [DOX, BUMBLEBEE]
    );
  });

  it("owns a unit's file for the units that inherit it", () => {
    assert.deepEqual(commanders.ownersOf(BASE_COMMANDER).sort(), [
      BASE_COMMANDER,
      IMPERIAL,
      QUAD,
    ]);
  });

  // base_spec replaces a key whole: a commander that declares its own tools
  // carries none of the base commander's.
  it("owns a part for the units that inherit it, not those that redeclare it", () => {
    assert.deepEqual(commanders.ownersOf(BASE_COMMANDER_WEAPON).sort(), [
      BASE_COMMANDER,
      IMPERIAL,
    ]);
    assert.deepEqual(commanders.ownersOf(BASE_COMMANDER_AMMO).sort(), [
      BASE_COMMANDER,
      IMPERIAL,
    ]);
    assert.deepEqual(commanders.ownersOf(QUAD_WEAPON), [QUAD]);
    // Its death weapon it still inherits.
    assert.deepEqual(commanders.ownersOf(NUKE).sort(), [
      BASE_COMMANDER,
      IMPERIAL,
      QUAD,
    ]);
  });

  it("owns an unread file of a unit's directory for the units that inherit it", () => {
    assert.deepEqual(
      commanders
        .ownersOf(
          "/pa/units/commanders/base_commander/base_commander_ammo.json"
        )
        .sort(),
      [BASE_COMMANDER, IMPERIAL, QUAD]
    );
  });

  it("works out a file's owners once", () => {
    assert.equal(lookup.ownersOf(DOX_AMMO), lookup.ownersOf(DOX_AMMO));
  });

  it("tells whether a commander owns a file", () => {
    assert.equal(commanders.ownedBy(BASE_COMMANDER_WEAPON, IMPERIAL), true);
    assert.equal(commanders.ownedBy(BASE_COMMANDER_WEAPON, QUAD), false);
    assert.equal(commanders.ownedBy(DOX, IMPERIAL), false);
  });

  // An inventory holds vanilla paths, and the referee moves the base
  // commander's mods to a race's, so a race commander stands in for it.
  it("judges a race commander as the base commander", () => {
    assert.deepEqual(commanders.reachable([BOT_FACTORY, DOX], RACE_COMMANDER), [
      BOT_FACTORY,
      DOX,
    ]);
    assert.equal(commanders.ownedBy(BASE_COMMANDER, RACE_COMMANDER), true);
    assert.equal(
      commanders.ownedBy(BASE_COMMANDER_WEAPON, RACE_COMMANDER),
      true
    );
    assert.equal(commanders.ownedBy(QUAD_WEAPON, RACE_COMMANDER), false);
  });

  it("reaches everything held from a race commander without the base one", () => {
    const noBase = coopAiUnits.fromSpecs({
      units: [RACE_COMMANDER, BOT_FACTORY, DOX, BUMBLEBEE],
      specs: COMMANDER_SPECS,
    });
    assert.deepEqual(noBase.reachable([DOX, BUMBLEBEE], RACE_COMMANDER), [
      DOX,
      BUMBLEBEE,
    ]);
  });

  it("lists the obtainable units it knows, commanders aside", () => {
    assert.deepEqual(commanders.obtainable, [BOT_FACTORY, DOX]);
    assert.deepEqual(lookup.obtainable, []);
  });
});

describe("fromGroups", () => {
  const byGroups = coopAiUnits.fromGroups(groups);

  it("classifies a vanilla unit by the groups it is in", () => {
    assert.equal(byGroups.via, "groups");
    assert.deepEqual(byGroups.classOf(gwoUnit.dox), {
      domain: "Bot",
      tier: "Basic",
      cls: "Combat",
      key: "Bot/Basic/Combat",
    });
    assert.equal(byGroups.classOf(gwoUnit.botFactory).key, "Bot/Basic/Factory");
    assert.equal(
      byGroups.classOf(gwoUnit.botFactoryAdvanced).key,
      "Bot/Advanced/Factory"
    );
    assert.equal(byGroups.classOf(gwoUnit.botFabber).cls, "Fabber");
    assert.equal(byGroups.classOf("/pa/units/race/unit.json"), undefined);
  });

  it("owns a part by its directory", () => {
    assert.deepEqual(byGroups.ownersOf(gwoUnit.dox), [gwoUnit.dox]);
    assert.ok(
      byGroups.ownersOf(gwoUnit.doxWeapon).includes(gwoUnit.dox),
      "the Dox's own directory"
    );
  });

  it("reaches a mobile unit only beside a factory of its domain", () => {
    assert.deepEqual(byGroups.reachable([gwoUnit.dox, gwoUnit.bumblebee]), []);
    assert.deepEqual(
      byGroups.reachable([gwoUnit.botFactory, gwoUnit.dox, gwoUnit.bumblebee]),
      [gwoUnit.botFactory, gwoUnit.dox]
    );
  });

  // Groups know no base_spec chains.
  it("takes a file of the base commander's to be every commander's", () => {
    assert.equal(byGroups.ownedBy(gwoUnit.commanderAmmo, IMPERIAL), true);
    assert.equal(
      byGroups.ownedBy(gwoUnit.commanderAmmo, gwoUnit.colonel),
      false
    );
    assert.equal(byGroups.ownedBy(gwoUnit.dox, IMPERIAL), false);
    assert.equal(byGroups.ownedBy(gwoUnit.dox, gwoUnit.dox), true);
  });

  it("lists every grouped unit as obtainable, commanders aside", () => {
    assert.ok(byGroups.obtainable.includes(gwoUnit.dox));
    assert.ok(!byGroups.obtainable.includes(gwoUnit.commander));
    assert.ok(
      byGroups.obtainable.every((unit) => byGroups.classOf(unit)),
      "every one has a cell"
    );
  });
});
