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
const paratrooper = loadCouiModule(
  path.join(CARDS_DIR, "gwaio_start_paratrooper.js")
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

// A loadout adds its AI mods only as the war's start card: the first card,
// on the first buff.
const START_CARD = {
  lookupCard: () => 0,
  getTag: (context, name, def) =>
    context === "" && name === "buffCount" ? 0 : def,
};

function aiModsOf(source, answers) {
  const aiMods = [];
  source.buff(
    createCapturingInventory({
      answers: answers,
      capture: { addAIMods: recordInto(aiMods) },
    })
  );
  return aiMods;
}

function advancedFactoryEntries(before) {
  const aiMods = (before || []).concat(aiModsOf(card));
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

  // Paratrooper's builders append has matchAll and comes first in the hand;
  // the card's refValue-matched appends must still find their entries.
  it("adds the basic bot factory with Paratrooper Commander first", () => {
    const before = aiModsOf(paratrooper, START_CARD).filter(
      (mod) => mod.op !== "load"
    );
    for (const build of advancedFactoryEntries(before)) {
      if (APPENDED.includes(build.to_build)) {
        assert.ok(
          build.builders.includes("BasicBotFactory"),
          build.to_build + " " + JSON.stringify(build.builders)
        );
      }
    }
  });
});
