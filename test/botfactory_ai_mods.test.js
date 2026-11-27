"use strict";

// Bot Factory Upgrade Tech appends BasicBotFactory to the builders of four
// bots, and finds six by builders equal to ["AdvancedBotFactory"] to replace
// their priority. Written in that order, the append hid four of the six from
// the replace. Penchant's factory files carry the stock entries for all six.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  loadCouiModule,
  requireShippedModule,
} = require("../scripts/lib/amd-loader.js");
const { CARDS_DIR } = require("../scripts/lib/card-files.js");
const {
  createCapturingInventory,
  recordInto,
} = require("../scripts/lib/capturing-inventory.js");
const { installCardHarness } = require("../scripts/lib/card-probe.js");

installCardHarness();

const { applyAiMods } = requireShippedModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_ai.js"
);
const card = loadCouiModule(
  path.join(CARDS_DIR, "gwaio_upgrade_botfactory.js")
);

const FACTORY_BUILDS = path.join(__dirname, "../pa/ai_penchant/factory_builds");
const BOTS = [
  "AdvancedArtilleryBot",
  "AdvancedAssaultBot",
  "AdvancedBotCombatFabber",
  "NanoSwarm",
  "SupportCommander",
  "TMLBot",
];
const APPENDED = [
  "AdvancedArtilleryBot",
  "AdvancedAssaultBot",
  "NanoSwarm",
  "TMLBot",
];

function cardAiMods() {
  const aiMods = [];
  card.buff(
    createCapturingInventory({
      capture: { addAIMods: recordInto(aiMods) },
    })
  );
  return aiMods;
}

function advancedFactoryEntries() {
  const aiMods = cardAiMods();
  const entries = [];
  for (const file of [
    "factory_land_builds.json",
    "factory_land_builds_x1.json",
  ]) {
    const json = JSON.parse(
      fs.readFileSync(path.join(FACTORY_BUILDS, file), "utf8")
    );
    applyAiMods(json, aiMods);
    entries.push(
      ...json.build_list.filter(
        (build) =>
          BOTS.includes(build.to_build) &&
          build.builders[0] === "AdvancedBotFactory"
      )
    );
  }
  return entries;
}

describe("gwaio_upgrade_botfactory AI mods", () => {
  it("sets priority 97 on all six advanced bots", () => {
    const entries = advancedFactoryEntries();
    assert.deepEqual(
      [...new Set(entries.map((build) => build.to_build))].sort(),
      BOTS
    );
    for (const build of entries) {
      assert.equal(build.priority, 97, build.to_build);
    }
  });

  it("lets the basic bot factory build the four non-fabber bots", () => {
    for (const build of advancedFactoryEntries()) {
      const expected = APPENDED.includes(build.to_build)
        ? ["AdvancedBotFactory", "BasicBotFactory"]
        : ["AdvancedBotFactory"];
      assert.deepEqual(build.builders, expected, build.to_build);
    }
  });
});
