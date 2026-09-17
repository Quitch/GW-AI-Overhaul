"use strict";

// The Rapid Deployment loadout rewrites what every fabber and factory may build,
// then loads a build file of its own. A builder that file names but the rewrite
// forbids is refused by the server every tick, which floods the AI log and
// stalls the Sub Commander. cross-refs.js only proves a builder role resolves,
// so this evaluates the card's buildable_types against what each entry builds.
//
// The base game is out of reach in CI, so the unit_types below are copied from
// it, as are the Commander's build list and the unit map's AnyAdvancedFabber.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const {
  loadCouiModule,
  requireShippedModule,
} = require("../scripts/lib/amd-loader.js");
const { matches } = require("../scripts/lib/build-types.js");
const { CARDS_DIR } = require("../scripts/lib/card-files.js");
const {
  createCapturingInventory,
  recordInto,
} = require("../scripts/lib/capturing-inventory.js");
const { installCardHarness } = require("../scripts/lib/card-probe.js");

installCardHarness();

const CLUSTER_FACTION = 4;
const TECH_FILE = "../pa/ai_tech/fabber_builds/gwaio_start_rapid.json";

const gwoUnit = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js"
);
const gwoCluster = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/faction/cluster_setup.js"
);
const { applyAiMods } = requireShippedModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_ai.js"
);
const card = loadCouiModule(path.join(CARDS_DIR, "gwaio_start_rapid.js"));

const tags = (list) => new Set(list.split(" "));
const FACTORY = "Custom58 Factory Construction Structure Important ";
const BASIC = FACTORY + "Basic CmdBuild FabBuild FabAdvBuild ";
const ADVANCED_BOT = "Custom58 Bot Mobile Land Advanced FactoryBuild ";

const TARGET_TAGS = {
  BasicAirFactory: tags(BASIC + "Air"),
  BasicBotFactory: tags(BASIC + "Land Bot"),
  BasicVehicleFactory: tags(BASIC + "Land Tank"),
  BasicNavalFactory: tags(BASIC + "Naval"),
  OrbitalLauncher: tags(BASIC + "Orbital Land"),
  AdvancedAirFactory: tags(FACTORY + "Advanced Air"),
  AdvancedBotFactory: tags(FACTORY + "Advanced Land Bot"),
  AdvancedVehicleFactory: tags(FACTORY + "Advanced Land Tank"),
  AdvancedNavalFactory: tags(FACTORY + "Advanced Naval"),
  SupportCommander: tags(
    ADVANCED_BOT + "Fabber Construction SupportCommander Amphibious"
  ),
  NanoSwarm: tags(
    ADVANCED_BOT + "Offense Deconstruction Hover CannonBuildable"
  ),
  AdvancedBotFabber: tags(ADVANCED_BOT + "Fabber Construction CannonBuildable"),
  AdvancedAssaultBot: tags(
    ADVANCED_BOT + "Sub Offense CannonBuildable Amphibious"
  ),
  AdvancedBotCombatFabber: tags(ADVANCED_BOT + "Construction CannonBuildable"),
  AdvancedArtilleryBot: tags(ADVANCED_BOT + "Offense CannonBuildable"),
  TMLBot: tags(ADVANCED_BOT + "Offense CannonBuildable"),
};

const ADVANCED_FABBERS = [
  gwoUnit.airFabberAdvanced,
  gwoUnit.botFabberAdvanced,
  gwoUnit.vehicleFabberAdvanced,
  gwoUnit.navalFabberAdvanced,
];

// Unit map role -> the specs it resolves to. AnyAdvancedFabber is
// `Fabber & Advanced - Orbital`, which takes in the Colonel.
const ROLE_FILES = {
  AnyAdvancedFabber: ADVANCED_FABBERS.concat(gwoUnit.colonel),
  SupportCommander: [gwoUnit.colonel],
  BasicAirFabber: [gwoUnit.airFabber],
  BasicBotFabber: [gwoUnit.botFabber],
  BasicVehicleFabber: [gwoUnit.vehicleFabber],
  BasicNavalFabber: [gwoUnit.navalFabber],
  AdvancedAirFabber: [gwoUnit.airFabberAdvanced],
  AdvancedBotFabber: [gwoUnit.botFabberAdvanced],
  AdvancedVehicleFabber: [gwoUnit.vehicleFabberAdvanced],
  AdvancedNavalFabber: [gwoUnit.navalFabberAdvanced],
};
const COMMANDER_BUILDS = "CmdBuild & Custom58";

function runCard(isCluster) {
  const mods = [];
  const aiMods = [];
  const inventory = createCapturingInventory({
    answers: {
      getTag: function (context, name, def) {
        return isCluster && context === "global" && name === "playerFaction"
          ? CLUSTER_FACTION
          : def;
      },
      lookupCard: function () {
        return 0;
      },
      hasCard: function () {
        return false;
      },
    },
    capture: { addMods: recordInto(mods), addAIMods: recordInto(aiMods) },
  });
  card.buff(inventory);
  return { mods: mods, aiMods: aiMods };
}

// The last write wins, and a Cluster Colonel's only write is cluster_setup.js's.
function buildableTypes(mods, file, isCluster) {
  const all = (isCluster ? gwoCluster.clusterCommanderMods : []).concat(mods);
  const writes = all.filter(
    (mod) =>
      mod.file === file &&
      mod.path === "buildable_types" &&
      mod.op === "replace"
  );
  assert.ok(writes.length, "nothing sets buildable_types for " + file);
  return writes[writes.length - 1].value;
}

// The tech file as the Sub Commander receives it: treeOnly descriptors never
// reach a loaded file, every other fabber one does.
function techFile(aiMods) {
  const json = structuredClone(require(TECH_FILE));
  applyAiMods(
    json,
    aiMods.filter(
      (mod) => mod.type === "fabber" && mod.op !== "load" && !mod.treeOnly
    )
  );
  return json;
}

for (const isCluster of [false, true]) {
  describe(
    "Rapid Deployment builders" + (isCluster ? " under Cluster" : ""),
    () => {
      const run = runCard(isCluster);
      const entries = techFile(run.aiMods).build_list.filter((build) =>
        Object.hasOwn(TARGET_TAGS, build.to_build)
      );

      it("covers the factory, launcher, and Colonel-built entries", () => {
        assert.equal(entries.length, 17);
      });

      it("names no builder the loadout forbids", () => {
        const refused = [];
        for (const build of entries) {
          for (const builder of build.builders) {
            const expressions =
              builder === "Commander"
                ? [COMMANDER_BUILDS]
                : ROLE_FILES[builder].map((file) =>
                    buildableTypes(run.mods, file, isCluster)
                  );
            for (const expression of expressions) {
              if (!matches(expression, TARGET_TAGS[build.to_build])) {
                refused.push(
                  build.name + ": " + builder + ' ("' + expression + '")'
                );
              }
            }
          }
        }
        assert.deepEqual(refused, []);
      });

      it("keeps a builder on every entry", () => {
        const orphaned = entries
          .filter((build) => !build.builders.length)
          .map((build) => build.name);
        assert.deepEqual(orphaned, []);
      });
    }
  );
}

describe("Rapid Deployment's Colonel", () => {
  const colonelBuilt = (isCluster) =>
    techFile(runCard(isCluster).aiMods)
      .build_list.filter((build) => build.builders.includes("SupportCommander"))
      .map((build) => build.to_build);

  it("builds the mobile bots only when it is not Cluster's", () => {
    assert.ok(colonelBuilt(false).includes("AdvancedAssaultBot"));
    assert.ok(!colonelBuilt(true).includes("AdvancedAssaultBot"));
  });
});

describe("Rapid Deployment's factory silence", () => {
  const silence = runCard(false).aiMods.filter((mod) => mod.op === "silence");

  it("is one treeOnly factory descriptor that spares the fabbers", () => {
    assert.equal(silence.length, 1);
    assert.equal(silence[0].type, "factory");
    assert.equal(silence[0].treeOnly, true);
    assert.ok(silence[0].value.builders.includes("BasicBotFactory"));
    assert.ok(silence[0].value.except.includes("BasicBotFabber"));
    assert.ok(!silence[0].value.except.includes("BasicBotCombatFabber"));
  });
});
