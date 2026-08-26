"use strict";

// The per-player-tech referee's per-viewer ai_path resolution, whose helpers live
// in the measured gw_play/per_player_tech.js.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const {
  makeInventory,
  SCENARIO_AXES,
} = require("../scripts/lib/ai-path-fixtures.js");

const hook = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/per_player_tech.js"
);
const refereeAIPaths = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_ai_paths.js"
);
const subcommanderTech = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_subcommander_tech.js"
);

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
    assert.equal(
      hook.stripKnownSpecTag("commander_uef.player"),
      "commander_uef"
    );
  });

  it("strips a trailing .playerN", () => {
    assert.equal(
      hook.stripKnownSpecTag("commander_uef.player3"),
      "commander_uef"
    );
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
    const inventory = makeInventory({ aiModsList: [{ op: "load" }] });
    const path = hook.getViewerSubcommanderAiPath(
      refereeAIPaths,
      subcommanderTech,
      "Titans",
      inventory,
      ".player"
    );
    assert.equal(path, "/pa/ai_subcommander/");
  });

  it("a non-host tag with active tech gets scoped by that raw tag", () => {
    const inventory = makeInventory({ aiModsList: [{ op: "load" }] });
    const path = hook.getViewerSubcommanderAiPath(
      refereeAIPaths,
      subcommanderTech,
      "Titans",
      inventory,
      ".player0"
    );
    // Matches referee_ai_paths.test.js's pinned raw/unsanitized scopeToken behavior -
    // the literal dot from the player tag is not stripped.
    assert.equal(path, "/pa/ai_subcommander/player_.player0/");
  });

  it("a non-host tag with no active tech still gets scoped onto the vanilla brain path", () => {
    const inventory = makeInventory({ aiModsList: [] });
    const path = hook.getViewerSubcommanderAiPath(
      refereeAIPaths,
      subcommanderTech,
      "Titans",
      inventory,
      ".player0"
    );
    // A scopeToken is passed for any non-host tag, whatever the aiMods gate picks
    // as the base path. That suffix is why viewers never collide even with no tech.
    assert.equal(path, "/pa/ai/player_.player0/");
  });

  it("is guardians-unaware by construction: always passes guardians:false", () => {
    // Pins the documented guardians asymmetry - see ai-paths.md.
    const inventory = makeInventory({ aiModsList: [{ op: "load" }] });
    const path = hook.getViewerSubcommanderAiPath(
      refereeAIPaths,
      subcommanderTech,
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
    const smartInventory = makeInventory({
      cardsList: [{ id: "gwaio_upgrade_subcommander_tactics" }],
    });
    const plainInventory = makeInventory({ cardsList: [] });

    assert.equal(
      hook.getViewerSubcommanderAiPath(
        refereeAIPaths,
        subcommanderTech,
        "Queller",
        smartInventory,
        ".player0"
      ),
      "/pa/ai_queller/q_silver/player_.player0/"
    );
    assert.equal(
      hook.getViewerSubcommanderAiPath(
        refereeAIPaths,
        subcommanderTech,
        "Queller",
        plainInventory,
        ".player0"
      ),
      "/pa/ai_queller/q_bronze/player_.player0/"
    );
  });

  it("stays pairwise-distinct across a heterogeneous mix of brains and aiMods states, not just uniform Titans", () => {
    const players = [
      { tag: ".player0", aiInUse: "Titans", aiModsList: [] },
      { tag: ".player1", aiInUse: "Titans", aiModsList: [{ op: "load" }] },
      { tag: ".player2", aiInUse: "Penchant", aiModsList: [] },
      { tag: ".player3", aiInUse: "Penchant", aiModsList: [{ op: "load" }] },
      { tag: ".player4", aiInUse: "Queller", aiModsList: [] },
      { tag: ".player5", aiInUse: "Queller", aiModsList: [{ op: "load" }] },
    ];

    const paths = players.map((player) =>
      hook.getViewerSubcommanderAiPath(
        refereeAIPaths,
        subcommanderTech,
        player.aiInUse,
        makeInventory({ aiModsList: player.aiModsList }),
        player.tag
      )
    );

    assert.equal(
      new Set(paths).size,
      paths.length,
      `expected all distinct, got: ${paths}`
    );
  });

  it("every brain in SCENARIO_AXES.AI_BRAINS still isolates 2 viewers from each other, active tech or not", () => {
    for (const aiInUse of SCENARIO_AXES.AI_BRAINS) {
      for (const aiModsList of [[], [{ op: "load" }]]) {
        const pathA = hook.getViewerSubcommanderAiPath(
          refereeAIPaths,
          subcommanderTech,
          aiInUse,
          makeInventory({ aiModsList }),
          ".player0"
        );
        const pathB = hook.getViewerSubcommanderAiPath(
          refereeAIPaths,
          subcommanderTech,
          aiInUse,
          makeInventory({ aiModsList }),
          ".player1"
        );
        assert.notEqual(
          pathA,
          pathB,
          `${aiInUse}, aiMods=${JSON.stringify(aiModsList)}`
        );
      }
    }
  });

  it("a Cluster-faction viewer is NOT routed to /pa/ai_cluster/ - it gets the ordinary brain-based subcommander path, isolated the same way as any other viewer", () => {
    // No Cluster branch is needed here: the per-viewer scope already provides the
    // isolation /pa/ai_cluster/ exists to give the host. See ai-paths.md.
    const clusterInventory = makeInventory({
      aiModsList: [{ op: "load" }],
      tags: { "global:playerFaction": 4 },
    });
    const otherClusterInventory = makeInventory({
      aiModsList: [{ op: "load" }],
      tags: { "global:playerFaction": 4 },
    });

    const clusterViewerPath = hook.getViewerSubcommanderAiPath(
      refereeAIPaths,
      subcommanderTech,
      "Titans",
      clusterInventory,
      ".player0"
    );
    const otherClusterViewerPath = hook.getViewerSubcommanderAiPath(
      refereeAIPaths,
      subcommanderTech,
      "Titans",
      otherClusterInventory,
      ".player1"
    );

    assert.equal(clusterViewerPath, "/pa/ai_subcommander/player_.player0/");
    assert.ok(!clusterViewerPath.includes("ai_cluster"));
    assert.notEqual(clusterViewerPath, otherClusterViewerPath);
  });
});
