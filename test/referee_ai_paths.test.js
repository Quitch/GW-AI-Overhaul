"use strict";

// Unit tests for shared/referee_ai_paths.js, the pure path-construction layer every
// other ai_path consumer (shared/ai.js, referee_config.js, referee_game_files.js,
// gw_per_player_tech_referee.js, referee_ai.js) routes through. Fully self-contained
// (define(function(){...}), no game-engine deps), so it's loaded directly with no
// model/api/$ mocking needed.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const refereeAIPaths = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_ai_paths.js"
);

describe("sanitizeToken", () => {
  it("strips leading dots", () => {
    assert.equal(refereeAIPaths.sanitizeToken(".player0"), "player0");
  });

  it("replaces runs of disallowed characters with a single underscore", () => {
    assert.equal(refereeAIPaths.sanitizeToken("a b/c!d"), "a_b_c_d");
  });

  it("strips leading and trailing underscores after replacement", () => {
    assert.equal(refereeAIPaths.sanitizeToken("...foo..."), "foo");
  });

  it("collapses a string of only disallowed characters to empty", () => {
    assert.equal(refereeAIPaths.sanitizeToken("!!!"), "");
  });

  it("treats a nullish value as an empty string", () => {
    assert.equal(refereeAIPaths.sanitizeToken(undefined), "");
    assert.equal(refereeAIPaths.sanitizeToken(null), "");
  });
});

describe("getScopeToken", () => {
  it("prefers playerTag over other identity fields", () => {
    const token = refereeAIPaths.getScopeToken(
      { playerTag: "p1", specTag: "s1", name: "n1" },
      "fallback"
    );
    assert.equal(token, "p1");
  });

  it("falls through the priority chain to the first present-and-truthy field", () => {
    const token = refereeAIPaths.getScopeToken(
      { playerTag: "", specTag: "s1" },
      "fallback"
    );
    // playerTag is present but falsy (empty string), so the ||-chain moves on to
    // specTag rather than stopping - this is subtle enough to pin explicitly.
    assert.equal(token, "s1");
  });

  it("falls back to fallbackToken when identity has no usable field", () => {
    const token = refereeAIPaths.getScopeToken({}, "fallback");
    assert.equal(token, "fallback");
  });

  it("falls back to fallbackToken when identity is a non-string, non-object", () => {
    assert.equal(refereeAIPaths.getScopeToken(42, "fallback"), "fallback");
  });

  it("falls back to fallbackToken when identity is an empty string", () => {
    assert.equal(refereeAIPaths.getScopeToken("", "fallback"), "fallback");
  });

  it("uses identity directly when it is already a non-empty string", () => {
    assert.equal(refereeAIPaths.getScopeToken(".player0", "fallback"), "player0");
  });

  it("falls back to the literal 'player' when identity and fallback both resolve empty", () => {
    assert.equal(refereeAIPaths.getScopeToken({}, ""), "player");
  });
});

describe("getAIPathDestination - cluster type", () => {
  it("always resolves to /pa/ai_cluster/ regardless of aiInUse/guardians/aiMods", () => {
    for (const aiInUse of ["Titans", "Queller", "Penchant"]) {
      const path = refereeAIPaths.getAIPathDestination("cluster", aiInUse, {
        guardians: true,
        aiMods: [{ op: "load" }],
      });
      assert.equal(path, "/pa/ai_cluster/", `aiInUse=${aiInUse}`);
    }
  });

  it("applies a scope token like any other type", () => {
    const path = refereeAIPaths.getAIPathDestination("cluster", "Titans", {
      scopeToken: "guardians",
    });
    assert.equal(path, "/pa/ai_cluster/player_guardians/");
  });
});

describe("getAIPathDestination - Titans/Penchant subcommander aiMods gate", () => {
  it("Titans + empty aiMods falls back to the shared /pa/ai/ path", () => {
    const path = refereeAIPaths.getAIPathDestination("subcommander", "Titans", {
      aiMods: [],
    });
    assert.equal(path, "/pa/ai/");
  });

  it("Titans + non-empty aiMods routes to the dedicated subcommander path", () => {
    const path = refereeAIPaths.getAIPathDestination("subcommander", "Titans", {
      aiMods: [{ op: "load" }],
    });
    assert.equal(path, "/pa/ai_subcommander/");
  });

  it("Penchant + empty aiMods falls back to the shared /pa/ai_penchant/ path", () => {
    const path = refereeAIPaths.getAIPathDestination("subcommander", "Penchant", {
      aiMods: [],
    });
    assert.equal(path, "/pa/ai_penchant/");
  });

  it("Penchant + non-empty aiMods routes to the dedicated subcommander path", () => {
    const path = refereeAIPaths.getAIPathDestination("subcommander", "Penchant", {
      aiMods: [{ op: "load" }],
    });
    assert.equal(path, "/pa/ai_subcommander/");
  });

  it("guardians blocks the dedicated subcommander path even with active aiMods", () => {
    const path = refereeAIPaths.getAIPathDestination("subcommander", "Titans", {
      guardians: true,
      aiMods: [{ op: "load" }],
    });
    assert.equal(path, "/pa/ai/");
  });

  it("enemy type never routes to the dedicated subcommander path even with aiMods set", () => {
    const path = refereeAIPaths.getAIPathDestination("enemy", "Titans", {
      aiMods: [{ op: "load" }],
    });
    assert.equal(path, "/pa/ai/");
  });
});

describe("getAIPathDestination - Queller", () => {
  it("enemy always resolves to q_uber/, regardless of smartSubcommanders", () => {
    for (const smartSubcommanders of [true, false]) {
      const path = refereeAIPaths.getAIPathDestination("enemy", "Queller", {
        smartSubcommanders: smartSubcommanders,
      });
      assert.equal(path, "/pa/ai_queller/q_uber/");
    }
  });

  it("subcommander resolves to q_silver/ when smartSubcommanders is true", () => {
    const path = refereeAIPaths.getAIPathDestination("subcommander", "Queller", {
      smartSubcommanders: true,
    });
    assert.equal(path, "/pa/ai_queller/q_silver/");
  });

  it("subcommander resolves to q_bronze/ when smartSubcommanders is false", () => {
    const path = refereeAIPaths.getAIPathDestination("subcommander", "Queller", {
      smartSubcommanders: false,
    });
    assert.equal(path, "/pa/ai_queller/q_bronze/");
  });

  it("the Queller branch takes priority over the subcommander aiMods gate", () => {
    // Even with empty aiMods (which would fall back to a shared path for
    // Titans/Penchant), Queller still separates enemy (q_uber) from subcommander
    // (q_bronze/q_silver) - Queller structurally never hits the Titans/Penchant
    // same-brain path-overlap case.
    const enemyPath = refereeAIPaths.getAIPathDestination("enemy", "Queller", {
      aiMods: [],
    });
    const subPath = refereeAIPaths.getAIPathDestination("subcommander", "Queller", {
      aiMods: [],
    });
    assert.notEqual(enemyPath, subPath);
  });
});

describe("getAIPathSource", () => {
  it("Penchant resolves to /pa/ai_penchant/", () => {
    assert.equal(
      refereeAIPaths.getAIPathSource("subcommander", "Penchant"),
      "/pa/ai_penchant/"
    );
  });

  it("Titans (and any unrecognized brain) resolves to /pa/ai/", () => {
    assert.equal(refereeAIPaths.getAIPathSource("enemy", "Titans"), "/pa/ai/");
    assert.equal(refereeAIPaths.getAIPathSource("enemy", "SomethingElse"), "/pa/ai/");
  });

  it("Queller enemy source is q_uber/, subcommander source is always q_bronze/", () => {
    // getAIPathSource always calls getQuellerPath(type, false) - smartSubcommanders
    // is hardcoded false, so unlike getAIPathDestination (which can resolve
    // subcommander to q_silver/), the subcommander SOURCE tree never varies by
    // smartSubcommanders - it's always q_bronze/, even when the destination the
    // build orders get copied TO is q_silver/.
    assert.equal(
      refereeAIPaths.getAIPathSource("enemy", "Queller"),
      "/pa/ai_queller/q_uber/"
    );
    assert.equal(
      refereeAIPaths.getAIPathSource("subcommander", "Queller"),
      "/pa/ai_queller/q_bronze/"
    );
  });
});

describe("scopeToken sanitization asymmetry", () => {
  it("getAIPathDestination appends a raw, unsanitized scopeToken literally", () => {
    const path = refereeAIPaths.getAIPathDestination("subcommander", "Titans", {
      aiMods: [{ op: "load" }],
      scopeToken: ".player0",
    });
    // The leading dot from the raw player tag is NOT stripped here - contrast with
    // getPlayerScopedUnitMapPath below, which does sanitize. A future refactor that
    // "fixes" this would silently change shipped mount paths.
    assert.equal(path, "/pa/ai_subcommander/player_.player0/");
  });

  it("getPlayerScopedUnitMapPath sanitizes the identity/fallback token first", () => {
    const path = refereeAIPaths.getPlayerScopedUnitMapPath(
      "/pa/ai_subcommander/",
      ".player0",
      "fallback",
      false
    );
    assert.equal(
      path,
      "/pa/ai_subcommander/player_player0/unit_maps/ai_unit_map.json"
    );
  });

  it("getPlayerScopedUnitMapPath appends _x1.json when titans is true", () => {
    const path = refereeAIPaths.getPlayerScopedUnitMapPath(
      "/pa/ai_subcommander/",
      ".player0",
      "fallback",
      true
    );
    assert.equal(
      path,
      "/pa/ai_subcommander/player_player0/unit_maps/ai_unit_map_x1.json"
    );
  });
});

describe("appendScope", () => {
  it("returns the base path unchanged when no scope token is given", () => {
    assert.equal(
      refereeAIPaths.getAIPathDestination("enemy", "Titans", {}),
      "/pa/ai/"
    );
  });
});
