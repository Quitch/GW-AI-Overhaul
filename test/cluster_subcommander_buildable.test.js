"use strict";

// Cluster fields Angels and Colonels as Sub Commanders and must never be able to build
// them ("CLUSTER: land. Uses Angels and Colonels as Sub Commanders and cannot build
// them" - gw_start/ui.js). faction/cluster_setup.js enforces that by replacing their
// `unit_types`: it strips the tags factories match on (FactoryBuild, Bot, ...) and adds
// UNITTYPE_NoBuild.
//
// That enforcement is ordering-fragile. The Cluster mods are added by gwc_start.buff(),
// which every loadout card calls *before* its own addMods, so they sit at the head of
// inventory.mods() and lose every conflict with a card applied later. gwaio_start_rapid
// once replaced the advanced air fabber's list with a bare "Mobile & Air" clause, which
// a post-Cluster Angel matches - handing Cluster a buildable Sub Commander with no
// error anywhere, in-game or in CI.
//
// So this sweeps every card: run its buff()/dull(), collect every buildable_types it
// authors, and assert none of them can match a Cluster Sub Commander. Base-game
// builders are out of reach here (CI has no install - see CLAUDE.md), but they were
// checked by hand and none match; cards are the only moving part.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  loadCouiModule,
  registerModuleStub,
  REPO_ROOT,
} = require("../scripts/lib/amd-loader.js");
const { createAutoStub } = require("../scripts/lib/auto-stub.js");
const { matches } = require("../scripts/lib/build-types.js");

// 61 of the cards - every loadout card among them, which is where the replacements this
// checks actually live - depend on the base game's shared/gw_common, which this repo
// doesn't ship. Without a stand-in they'd all be skipped and the sweep below would pass
// by testing nothing. The cards only read balance constants off it, so an auto-stub is
// enough; nothing here asserts on values that came through it.
registerModuleStub("shared/gw_common", createAutoStub());

// The loadout cards pull in shared/bank.js, which constructs itself at define time and
// so reads ko and localStorage before any test runs. Minimal stand-ins, in the shape
// test/gw_galaxy_path_between.js uses: an observable is a get/set closure, and a
// subscription that never fires is correct here - nothing in this file writes one.
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

const CARDS_DIR = path.join(
  REPO_ROOT,
  "ui",
  "main",
  "game",
  "galactic_war",
  "cards"
);

// scripts/validate/{cards,ai-mods}-contract.js each carry their own copy of this for
// the same reason: a card that fails to load for a reviewed reason other than a missing
// base-game module. Keep the three in step.
const KNOWN_UNLOADABLE = new Set(["gwc_minion.js"]);

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

// The tags a Sub Commander carries in-game: whatever cluster_setup.js's `replace`
// leaves it with, plus anything a card pushes on top (gwaio_upgrade_angel adds Gunship
// and Offense). Cards can only add tags, so the union is the worst case.
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

// What cluster_setup.js gives a Sub Commander to build - the commander build list,
// since that is what it now is. Every loadout card routes through gwc_start.buff(), so
// this descriptor turns up in the sweep once per card; anything else writing the same
// path is a card overwriting the faction's rule.
function clusterBuildableTypes(file) {
  const mod = gwoCluster.clusterCommanderMods.find(
    (candidate) =>
      candidate.file === file && candidate.path === "buildable_types"
  );
  assert.ok(mod, "cluster_setup.js no longer sets buildable_types for " + file);
  return mod.value;
}

// A mock inventory in the shape validate/ai-mods-contract.js uses - auto-stubbed except
// for the handful of answers that steer a card down the branch under test: the player
// is Cluster, and this is the loadout's first buff (lookupCard 0 / buffCount falsy), so
// loadout cards author their mods instead of just widening the hand.
function collectMods(card, hasCard) {
  const captured = [];
  const inventory = new Proxy(
    {
      addMods: function (mods) {
        // gw_inventory.js's addMods is mods().concat(mods), which takes a bare
        // descriptor as readily as an array.
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
    if (e.code === "NOT_SHIPPED" || KNOWN_UNLOADABLE.has(file)) {
      return { excluded: true };
    }
    throw e;
  }
}

// Both branches of any `if (inventory.hasCard(...))` fork are real in-game states, so
// take each card down both rather than whichever one a fixed answer happens to pick.
function collectAllCardMods() {
  const mods = [];
  const cards = [];

  for (const file of fs
    .readdirSync(CARDS_DIR)
    .filter((f) => f.endsWith(".js"))) {
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

// An `add` on a string spec value concatenates (see shared/specs.js's ops), and every
// card using it appends an alternative - " | (Air & Mobile & ...)". Judging that
// fragment on its own is the right test: an alternative that matches makes the whole
// expression match, whatever the base value it was appended to.
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
    // fabrication_bot_adv's real expression: the - Factory applies to the first
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
    // Guards against a loader change quietly reducing this to a no-op. Same reach as
    // validate:cards - 175 of the 237 cards load, the rest being NOT_SHIPPED or
    // KNOWN_UNLOADABLE - so this only needs to catch a collapse, not track the count.
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
      // Order-independent by design. The Cluster mods are added first and so lose any
      // conflict, and which cards a player holds is unknowable here - so the invariant
      // is that nothing else writes the path at all, not that it wins a race.
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
