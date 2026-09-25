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
});
