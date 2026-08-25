"use strict";

// Cluster fields Angels and Colonels as Sub Commanders and must never be able to
// build them. cluster_setup.js enforces that by stripping the tags factories match
// on and adding UNITTYPE_NoBuild.
//
// The enforcement is ordering-fragile: gwc_start.buff() adds the Cluster mods before
// any loadout card's own, so they sit at the head of inventory.mods() and lose every
// later conflict. A bare "Mobile & Air" clause added afterwards matches an Angel,
// handing Cluster a buildable Sub Commander with no error anywhere.
//
// So this sweeps every card for the buildable_types it authors. Base-game builders
// are out of reach in CI; they were checked by hand and none match.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const {
  loadCouiModule,
  registerModuleStub,
} = require("../scripts/lib/amd-loader.js");
const { createAutoStub } = require("../scripts/lib/auto-stub.js");
const { matches } = require("../scripts/lib/build-types.js");
const {
  CARDS_DIR,
  classifyLoadFailure,
  listCardFiles,
} = require("../scripts/lib/card-files.js");

// Every loadout card - which is where the replacements live - depends on the
// unshipped shared/gw_common, so without a stand-in the sweep tests nothing. Only
// balance constants are read off it, and nothing here asserts on those.
registerModuleStub("shared/gw_common", createAutoStub());

// shared/bank.js constructs itself at define time, so it reads ko and localStorage
// before any test runs. A subscription that never fires is correct here.
function makeObservable(initial) {
  let value = initial;
  const observable = function () {
    if (arguments.length) {
      value = arguments[0];
      return;
    }
    return value;
  };
  observable.subscribe = () => ({ dispose: () => {} });
  observable.extend = () => observable;
  return observable;
}

global.ko = {
  observable: makeObservable,
  observableArray: makeObservable,
  computed: (fn) => fn,
};
global.localStorage = {};

const CLUSTER_FACTION = 4;
const UNIT_TYPE_PREFIX = "UNITTYPE_";

const gwoUnit = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js"
);
const gwoCluster = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/faction/cluster_setup.js"
);

const SUB_COMMANDERS = [
  { name: "Angel", file: gwoUnit.angel },
  { name: "Colonel", file: gwoUnit.colonel },
];

function stripPrefix(unitTypes) {
  return unitTypes.map((type) =>
    type.startsWith(UNIT_TYPE_PREFIX)
      ? type.slice(UNIT_TYPE_PREFIX.length)
      : type
  );
}

// What cluster_setup.js leaves, plus anything a card adds. Cards can only add
// tags, so the union is the worst case.
function clusterTags(file, cardMods) {
  const replaced = gwoCluster.clusterCommanderMods.find(
    (mod) =>
      mod.file === file && mod.path === "unit_types" && mod.op === "replace"
  );
  assert.ok(
    replaced,
    "cluster_setup.js no longer replaces unit_types for " +
      file +
      " - this check's tag sets are derived from that mod"
  );

  const tags = new Set(stripPrefix(replaced.value));
  for (const mod of cardMods) {
    if (
      mod.file !== file ||
      mod.path !== "unit_types" ||
      (mod.op !== "push" && mod.op !== "add")
    ) {
      continue;
    }
    for (const tag of stripPrefix([].concat(mod.value))) {
      tags.add(tag);
    }
  }
  return tags;
}

// The commander build list cluster_setup.js gives a Sub Commander. It appears once
// per card; anything else writing that path is a card overwriting the faction rule.
function clusterBuildableTypes(file) {
  const mod = gwoCluster.clusterCommanderMods.find(
    (candidate) =>
      candidate.file === file && candidate.path === "buildable_types"
  );
  assert.ok(mod, "cluster_setup.js no longer sets buildable_types for " + file);
  return mod.value;
}

// Auto-stubbed except for the answers that steer a card down the branch under test:
// the player is Cluster, and this is the loadout's first buff, so cards author their
// mods rather than just widening the hand.
function collectMods(card, hasCard) {
  const captured = [];
  const inventory = new Proxy(
    {
      addMods: function (mods) {
        // addMods concats, so it takes a bare descriptor as readily as an array.
        if (Array.isArray(mods)) {
          captured.push(...mods);
        } else if (mods) {
          captured.push(mods);
        }
        return createAutoStub();
      },
      getTag: function (context, name, def) {
        if (context === "global" && name === "playerFaction") {
          return CLUSTER_FACTION;
        }
        return def;
      },
      lookupCard: function () {
        return 0;
      },
      hasCard: function () {
        return hasCard;
      },
    },
    {
      get(target, prop) {
        return prop in target ? target[prop] : createAutoStub();
      },
    }
  );

  for (const method of ["buff", "dull"]) {
    if (typeof card[method] === "function") {
      card[method](inventory);
    }
  }
  return captured;
}

function loadCard(file) {
  try {
    return { card: loadCouiModule(path.join(CARDS_DIR, file)) };
  } catch (e) {
    if (classifyLoadFailure(e, file)) {
      return { excluded: true };
    }
    throw e;
  }
}

// Both branches of a hasCard fork are real in-game states, so take each card down
// both rather than whichever a fixed answer picks.
function collectAllCardMods() {
  const mods = [];
  const cards = [];

  for (const file of listCardFiles()) {
    const loaded = loadCard(file);
    if (loaded.excluded) {
      continue;
    }
    cards.push(file);
    for (const hasCard of [false, true]) {
      for (const mod of collectMods(loaded.card, hasCard)) {
        mods.push({ card: file, mod: mod });
      }
    }
  }

  return { mods: mods, cards: cards };
}

// `add` concatenates, and every card using it appends an alternative. Judging the
// fragment alone is right: a matching alternative matches whatever it was appended to.
function expressionsFrom(mod) {
  if (mod.path !== "buildable_types") {
    return [];
  }
  const value = String(mod.value).trim();
  return [value.startsWith("|") ? value.slice(1) : value];
}

describe("buildable_types expression evaluator", () => {
  const mobile = new Set(["Mobile", "Air", "Custom58"]);
  const template = new Set(["Mobile", "Air", "NoBuild"]);

  it("treats - as and-not, as the Unit Cannon's own expression relies on", () => {
    assert.equal(matches("Mobile - NoBuild", mobile), true);
    assert.equal(matches("Mobile - NoBuild", template), false);
  });

  it("binds & and - tighter than |", () => {
    // fabrication_bot_adv's real expression: `- Factory` binds to the first
    // alternative only, so a plain Factory still matches via the second.
    const expression =
      "Land & Structure & Advanced - Factory| Factory & Advanced & Bot & Land | FabAdvBuild | FabBuild";
    assert.equal(
      matches(expression, new Set(["Land", "Structure", "Advanced"])),
      true
    );
    assert.equal(
      matches(
        expression,
        new Set(["Land", "Structure", "Advanced", "Factory"])
      ),
      false
    );
    assert.equal(
      matches(expression, new Set(["Factory", "Advanced", "Bot", "Land"])),
      true
    );
  });

  it("applies a trailing exclusion to a whole parenthesised expression", () => {
    // The shape gwaio_start_rapid uses: ((...) & Custom58) - NoBuild.
    const expression = "(Mobile & Air | Titan & Air) & Custom58 - NoBuild";
    assert.equal(matches(expression, mobile), true);
    assert.equal(
      matches(expression, new Set(["Mobile", "Air", "Custom58", "NoBuild"])),
      false
    );
  });

  it("reads an unknown or missing token as false rather than throwing", () => {
    assert.equal(matches("Nonsense", mobile), false);
    assert.equal(matches("", mobile), false);
  });
});

describe("Cluster Sub Commanders cannot be built", () => {
  const collected = collectAllCardMods();
  const tagsByName = new Map(
    SUB_COMMANDERS.map((unit) => [
      unit.name,
      clusterTags(
        unit.file,
        collected.mods.map((entry) => entry.mod)
      ),
    ])
  );

  it("loads the cards it is sweeping", () => {
    // Guards against a loader change reducing this to a no-op. Meant to catch a
    // collapse, not track the count.
    assert.ok(collected.cards.length > 150, collected.cards.length + " cards");
  });

  for (const unit of SUB_COMMANDERS) {
    it(
      "keeps " + unit.name + " tagged NoBuild and out of factory lists",
      () => {
        const tags = tagsByName.get(unit.name);
        assert.ok(
          tags.has("NoBuild"),
          unit.name + " lost UNITTYPE_NoBuild: " + [...tags].join(", ")
        );
        assert.ok(
          !tags.has("FactoryBuild"),
          unit.name + " regained UNITTYPE_FactoryBuild: " + [...tags].join(", ")
        );
      }
    );

    it("lets no card overwrite " + unit.name + "'s Cluster build list", () => {
      // The Cluster mods lose every conflict, and the player's hand is unknowable
      // here, so the invariant is that nothing else writes the path at all.
      const clusterValue = clusterBuildableTypes(unit.file);
      const overwrites = collected.mods
        .filter(
          (entry) =>
            entry.mod.file === unit.file &&
            entry.mod.path === "buildable_types" &&
            entry.mod.value !== clusterValue
        )
        .map((entry) => entry.card + ': "' + entry.mod.value + '"');
      assert.deepEqual([...new Set(overwrites)], []);
    });

    it("has no card that makes " + unit.name + " buildable", () => {
      const tags = tagsByName.get(unit.name);
      const leaks = collected.mods.flatMap((entry) =>
        expressionsFrom(entry.mod)
          .filter((expression) => matches(expression, tags))
          .map(
            (expression) =>
              entry.card + " -> " + entry.mod.file + ': "' + expression + '"'
          )
      );
      assert.deepEqual(
        [...new Set(leaks)],
        [],
        unit.name + " is buildable via " + leaks.length + " card mod(s)"
      );
    });
  }
});

// The CEO Commander is the one loadout that gives Cluster a buildable Colonel,
// and it does so without touching Cluster's own. The sweep above only proves the
// faction's Colonel stayed locked, so these pin the mechanism that keeps it that
// way: a clone taken before cluster_setup.js runs.
describe("the CEO Commander's Cluster Colonel", () => {
  const ceoMods = collectAllCardMods()
    .mods.filter((entry) => entry.card === "gwaio_start_ceo.js")
    .map((entry) => entry.mod);

  it("copies the Colonel rather than modifying it", () => {
    const clone = ceoMods.find(
      (mod) => mod.op === "clone" && mod.file === gwoUnit.colonel
    );
    assert.ok(clone, "gwaio_start_ceo no longer clones the Colonel");
    assert.equal(clone.value, gwoUnit.clusterCeoColonel);
  });

  it("drops FactoryBuild from the copy, so only a Commander builds it", () => {
    const pull = ceoMods.find(
      (mod) =>
        mod.file === gwoUnit.clusterCeoColonel &&
        mod.path === "unit_types" &&
        mod.op === "pull"
    );
    assert.ok(pull, "the copy keeps UNITTYPE_FactoryBuild");
    assert.equal(pull.value, "UNITTYPE_FactoryBuild");
  });

  it("changes nothing on the Colonel Cluster fields", () => {
    // gwc_start.buff hands Cluster's own mods to every loadout, so those come
    // back through this card too. They are the same objects, so drop them.
    const touched = ceoMods
      .filter(
        (mod) =>
          mod.file === gwoUnit.colonel &&
          mod.op !== "clone" &&
          !gwoCluster.clusterCommanderMods.includes(mod)
      )
      .map((mod) => mod.op + " " + mod.path);
    assert.deepEqual([...new Set(touched)], []);
  });
});
