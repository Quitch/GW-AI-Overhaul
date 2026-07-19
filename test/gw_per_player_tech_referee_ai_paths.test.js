"use strict";

// Unit tests for gw_per_player_tech_referee.js's per-viewer ai_path resolution,
// reached via its test-only module.exports hook. This file depends on
// shared/gw_common and shared/gw_inventory (base-game modules GWO doesn't ship), so
// its define() call is gated the same way referee_game_files.js's is - see the
// hook's own comment in gw_per_player_tech_referee.js.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  loadCouiModule,
  requireShippedModule,
} = require("../scripts/lib/amd-loader.js");

const hook = requireShippedModule(
  "coui://ui/main/game/galactic_war/gw_play/gw_per_player_tech_referee.js"
);
const refereeAIPaths = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_ai_paths.js"
);

function makePlayerInventory(overrides) {
  const data = Object.assign({ aiModsList: [], cardsList: [] }, overrides || {});
  return {
    aiMods: () => data.aiModsList,
    cards: () => data.cardsList,
  };
}

describe("getPlayerTagGivenIndex", () => {
  it("index 0 is the host tag .player", () => {
    assert.equal(hook.getPlayerTagGivenIndex(0), ".player");
  });

  it("subsequent indices are .player0, .player1, ...", () => {
    assert.equal(hook.getPlayerTagGivenIndex(1), ".player0");
    assert.equal(hook.getPlayerTagGivenIndex(2), ".player1");
    assert.equal(hook.getPlayerTagGivenIndex(5), ".player4");
  });
});

describe("stripKnownSpecTag", () => {
  it("strips a trailing .player", () => {
    assert.equal(hook.stripKnownSpecTag("commander_uef.player"), "commander_uef");
  });

  it("strips a trailing .playerN", () => {
    assert.equal(hook.stripKnownSpecTag("commander_uef.player3"), "commander_uef");
  });

  it("passes through a value with no recognized spec tag", () => {
    assert.equal(hook.stripKnownSpecTag("commander_uef"), "commander_uef");
  });

  it("passes through a non-string value unchanged", () => {
    assert.equal(hook.stripKnownSpecTag(undefined), undefined);
    assert.equal(hook.stripKnownSpecTag(42), 42);
  });
});

describe("getViewerSubcommanderAiPath", () => {
  it("the host tag (.player) never gets a scoped path, even with active tech", () => {
    const inventory = makePlayerInventory({ aiModsList: [{ op: "load" }] });
    const path = hook.getViewerSubcommanderAiPath(
      refereeAIPaths,
      "Titans",
      inventory,
      ".player"
    );
    assert.equal(path, "/pa/ai_subcommander/");
  });

  it("a non-host tag with active tech gets scoped by that raw tag", () => {
    const inventory = makePlayerInventory({ aiModsList: [{ op: "load" }] });
    const path = hook.getViewerSubcommanderAiPath(
      refereeAIPaths,
      "Titans",
      inventory,
      ".player0"
    );
    // Matches referee_ai_paths.test.js's pinned raw/unsanitized scopeToken behavior -
    // the literal dot from the player tag is not stripped.
    assert.equal(path, "/pa/ai_subcommander/player_.player0/");
  });

  it("a non-host tag with no active tech still gets scoped onto the vanilla brain path", () => {
    const inventory = makePlayerInventory({ aiModsList: [] });
    const path = hook.getViewerSubcommanderAiPath(
      refereeAIPaths,
      "Titans",
      inventory,
      ".player0"
    );
    // Unlike shared/ai.js's getAIPathDestination("enemy") wrapper (which only
    // auto-scopes under guardians), getViewerSubcommanderAiPath always passes a
    // scopeToken for any non-host tag, regardless of the aiMods gate that picks the
    // *base* path. So even when aiMods is empty and the base path falls back to the
    // vanilla /pa/ai/ (same base as the enemy - the known Titans/Penchant overlap
    // pinned in referee_ai_paths.test.js and ai_path_invariants.test.js), the scope
    // suffix still makes this viewer's path distinct from the enemy's and from every
    // other viewer's - this is precisely why per-player-tech subcommanders never
    // collide with each other even without active tech.
    assert.equal(path, "/pa/ai/player_.player0/");
  });

  it("is guardians-unaware by construction: always passes guardians:false", () => {
    // getViewerSubcommanderAiPath has no guardians parameter at all - it can't
    // vary by the fight's actual guardians state, unlike shared/ai.js's
    // getAIPathDestination("subcommander") wrapper used for shared-tech allies.
    // This pins that current, documented asymmetry (see the function's own
    // comment in gw_per_player_tech_referee.js) rather than asserting it's correct.
    const inventory = makePlayerInventory({ aiModsList: [{ op: "load" }] });
    const path = hook.getViewerSubcommanderAiPath(
      refereeAIPaths,
      "Titans",
      inventory,
      ".player0"
    );
    assert.equal(
      path,
      refereeAIPaths.getAIPathDestination("subcommander", "Titans", {
        guardians: false,
        aiMods: inventory.aiMods(),
        smartSubcommanders: false,
        scopeToken: ".player0",
      })
    );
  });

  it("smartSubcommanders toggles Queller q_silver/ vs q_bronze/ via the tactics card", () => {
    const smartInventory = makePlayerInventory({
      cardsList: [{ id: "gwaio_upgrade_subcommander_tactics" }],
    });
    const plainInventory = makePlayerInventory({ cardsList: [] });

    assert.equal(
      hook.getViewerSubcommanderAiPath(
        refereeAIPaths,
        "Queller",
        smartInventory,
        ".player0"
      ),
      "/pa/ai_queller/q_silver/player_.player0/"
    );
    assert.equal(
      hook.getViewerSubcommanderAiPath(
        refereeAIPaths,
        "Queller",
        plainInventory,
        ".player0"
      ),
      "/pa/ai_queller/q_bronze/player_.player0/"
    );
  });
});
