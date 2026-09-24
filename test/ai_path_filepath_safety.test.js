"use strict";

// Requirement: the AI never receives a malformed filepath. Two levels - the
// referee_ai_paths.js helpers fed traversal-shaped input directly, pinning which
// sanitise and which leave it to the caller; and referee_ai.js over the real
// scenario matrix, asserting every configFiles key it writes is well-formed.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const {
  buildGame,
  useModel,
  makeInventory,
  SCENARIO_AXES,
  withTwoViewers,
} = require("../scripts/lib/ai-path-fixtures.js");
const {
  installRefereeFakes,
  runRefereeAi,
} = require("../scripts/lib/referee-fakes.js");

const refereeAIPaths = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_ai_paths.js"
);
const refereeAi = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_ai.js"
);

function assertWellFormedPath(path, context) {
  assert.equal(typeof path, "string", `${context}: expected a string path`);
  assert.ok(
    path.startsWith("/pa/"),
    `${context}: does not start with /pa/: ${path}`
  );
  assert.ok(!path.includes(".."), `${context}: contains "..": ${path}`);
  assert.ok(!path.includes("//"), `${context}: contains "//": ${path}`);
  for (const unset of ["undefined", "NaN", "null"]) {
    assert.ok(
      !path.includes(unset),
      `${context}: leaked "${unset}" into the path: ${path}`
    );
  }
}

// Asserting non-empty first is what stops the loop being vacuous: a regression
// writing no keys at all would otherwise pass every generated case silently.
function assertEveryKeyWellFormed(filesObj, context) {
  const keys = Object.keys(filesObj);
  assert.ok(
    keys.length > 0,
    "expected referee_ai to write at least one config file"
  );
  for (const key of keys) {
    assertWellFormedPath(key, context);
  }
  return keys;
}

const ADVERSARIAL_TOKENS = [
  "../../etc",
  "a/b/../c",
  "..\\..\\x",
  "//",
  "\u0000abc",
  "a".repeat(500),
  { toString: () => "../../object" }, // traversal arriving via string coercion
];

describe("sanitizeToken never lets traversal/injection characters through", () => {
  for (const input of ADVERSARIAL_TOKENS) {
    it(`sanitizes ${JSON.stringify(String(input)).slice(0, 40)}`, () => {
      const result = refereeAIPaths.sanitizeToken(input);
      assert.equal(typeof result, "string");
      assert.ok(!result.includes(".."), `contains "..": ${result}`);
      assert.ok(!result.includes("/"), `contains "/": ${result}`);
      assert.ok(!result.includes("\\"), `contains "\\": ${result}`);
      assert.ok(
        !/[^A-Za-z0-9_-]/.test(result),
        `contains disallowed chars: ${result}`
      );
    });
  }
});

describe("getScopeToken always routes through sanitizeToken, even for adversarial identity fields", () => {
  for (const field of [
    "playerTag",
    "specTag",
    "client_name",
    "playerName",
    "name",
  ]) {
    it(`sanitizes an adversarial identity.${field}`, () => {
      const identity = {};
      identity[field] = "../../../etc/passwd";
      const token = refereeAIPaths.getScopeToken(identity, "fallback");
      assert.ok(!token.includes(".."), `contains "..": ${token}`);
      assert.ok(!token.includes("/"), `contains "/": ${token}`);
    });
  }

  it("sanitizes an adversarial fallback token too, when identity resolves empty", () => {
    const token = refereeAIPaths.getScopeToken({}, "../../fallback");
    assert.ok(!token.includes(".."), `contains "..": ${token}`);
    assert.ok(!token.includes("/"), `contains "/": ${token}`);
  });
});

describe("getAIPathDestination: scopeToken is NOT sanitized - callers must pre-sanitize via getScopeToken", () => {
  // A raw scopeToken does produce a traversal-shaped path. No current call site
  // passes one, so this pins the boundary: sanitise before adding a new one.
  it("a raw traversal-shaped scopeToken is not stripped", () => {
    const path = refereeAIPaths.getAIPathDestination("subcommander", "Titans", {
      aiMods: [{ op: "load" }],
      scopeToken: "../../etc",
    });
    assert.equal(path, "/pa/ai_subcommander/player_../../etc/");
  });

  it("pre-sanitizing via getScopeToken closes that hole", () => {
    const safeToken = refereeAIPaths.getScopeToken("../../etc", "fallback");
    const path = refereeAIPaths.getAIPathDestination("subcommander", "Titans", {
      aiMods: [{ op: "load" }],
      scopeToken: safeToken,
    });
    assertWellFormedPath(
      path,
      "getAIPathDestination with pre-sanitized scopeToken"
    );
  });
});

describe("referee_ai.js integration: every configFiles key it writes is well-formed", () => {
  const installModel = useModel();
  let restoreFakes;

  afterEach(() => {
    if (restoreFakes) {
      restoreFakes();
      restoreFakes = undefined;
    }
  });

  // The listing is derived from the requested path rather than enumerated, so every
  // ai_path this sweep reaches yields files without the fixture naming them all.
  function installFakes() {
    restoreFakes = installRefereeFakes({
      listFiles: (path) => [
        path + "fabber_builds/x.json",
        path + "factory_builds/y.json",
      ],
      getJSON: () => ({
        build_list: [{ to_build: "Bot", priority: 1, builders: [] }],
      }),
    }).restore;
  }

  function run(filesObj) {
    return runRefereeAi(refereeAi, filesObj);
  }

  for (const aiInUse of SCENARIO_AXES.AI_BRAINS) {
    for (const enemyType of SCENARIO_AXES.ENEMY_TYPES) {
      for (const techState of SCENARIO_AXES.SUBCOMMANDER_TECH_STATES) {
        it(`${aiInUse} / enemy=${enemyType} / tech=${techState}: no malformed keys`, async () => {
          const fixture = buildGame({
            aiInUse: aiInUse,
            enemyType: enemyType,
            aiMods:
              techState === "active"
                ? [{ op: "load", type: "fabber", value: "extra_load.json" }]
                : [],
          });
          installModel(fixture.game, []);
          installFakes();

          const filesObj = {};
          await run(filesObj);

          assertEveryKeyWellFormed(
            filesObj,
            `${aiInUse}/${enemyType}/${techState}`
          );
        });
      }
    }
  }

  it("a Cluster player's scoped copies stay well-formed", async () => {
    const fixture = buildGame({
      aiInUse: "Titans",
      subcommanderType: "cluster",
      aiMods: [{ op: "load", type: "fabber", value: "extra_load.json" }],
    });
    installModel(fixture.game, []);
    installFakes();

    const filesObj = {};
    await run(filesObj);

    assertEveryKeyWellFormed(filesObj, "cluster player");
  });

  it("per-player-tech viewers with attacker-shaped display names never leak into the path (scope tokens are index-derived, not name-derived)", async () => {
    const fixture = buildGame({
      aiInUse: "Titans",
      enemyType: "neither",
      aiMods: [],
    });
    const viewer1Inventory = makeInventory({
      aiModsList: [{ op: "load", type: "fabber", value: "extra_load.json" }],
    });
    const viewer2Inventory = makeInventory({ aiModsList: [] });
    const connectedClients = withTwoViewers(
      fixture.game,
      viewer1Inventory,
      viewer2Inventory,
      ["../../../etc/passwd", "<script>alert(1)</script>"]
    );
    installModel(fixture.game, connectedClients);
    installFakes();

    const filesObj = {};
    await run(filesObj);

    for (const key of assertEveryKeyWellFormed(
      filesObj,
      "per-player-tech viewer with adversarial name"
    )) {
      assert.ok(!key.includes("etc"), `leaked viewer display name: ${key}`);
      assert.ok(!key.includes("script"), `leaked viewer display name: ${key}`);
    }
  });
});
