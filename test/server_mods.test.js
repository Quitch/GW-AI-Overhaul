"use strict";

// scripts/lib/server-mods.js: the server mods harvest-unit-types.js mounts,
// derived from the shipped race and add-on descriptors.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { MOD_ROOT, loadCouiModule } = require("../scripts/lib/amd-loader.js");
const {
  COMPANIONS,
  shippedServerMods,
} = require("../scripts/lib/server-mods.js");

const races = loadCouiModule(MOD_ROOT + "/shared/races_shipped.js");
const addons = loadCouiModule(MOD_ROOT + "/shared/addons_shipped.js");
const companionIds = new Set(Object.values(COMPANIONS).flat());

describe("shippedServerMods", () => {
  const mods = shippedServerMods();

  it("mounts every race's mods, then every add-on's, in registry order", () => {
    const own = races.concat(addons).flatMap((d) => d.serverMods);
    assert.ok(own.length > 0);
    assert.deepEqual(
      mods.filter((id) => !companionIds.has(id)),
      own
    );
  });

  it("mounts each companion just before the mod that needs it", () => {
    for (const [id, companions] of Object.entries(COMPANIONS)) {
      const at = mods.indexOf(id);
      assert.ok(at >= 0, id + " is no longer a shipped descriptor's mod");
      assert.deepEqual(mods.slice(at - companions.length, at), companions);
    }
  });

  it("names no mod twice", () => {
    assert.equal(new Set(mods).size, mods.length);
  });
});
