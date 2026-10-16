"use strict";

// The hire's viewer list against the launch's (issue #540). The hire numbers
// each viewer's Sub Commander tree by position in the list it read; stock reads
// the list again for the per-player-tech referee, so the two must agree. See
// coop.md, "The two referees".

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const {
  buildGame,
  useModel,
  makeInventory,
  withTwoViewers,
} = require("../scripts/lib/ai-path-fixtures.js");
const { installRefereeFakes } = require("../scripts/lib/referee-fakes.js");

const perPlayerTech = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/per_player_tech.js"
);
const refereeAi = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_ai.js"
);

const describeMismatch = perPlayerTech.describeClientMismatch;

describe("describeClientMismatch", () => {
  it("passes the same viewers in the same order", () => {
    assert.equal(describeMismatch(["v1::A", "v2::B"], ["v1::A", "v2::B"]), "");
  });

  it("passes a session with no viewers", () => {
    assert.equal(describeMismatch([], []), "");
  });

  it("fails a viewer who dropped after the hire", () => {
    assert.equal(
      describeMismatch(["v1::A", "v2::B"], ["v2::B"]),
      "left during setup: v1::A"
    );
  });

  it("fails a viewer who joined after the hire", () => {
    assert.equal(
      describeMismatch(["v1::A"], ["v1::A", "v2::B"]),
      "joined during setup: v2::B"
    );
  });

  it("fails the same viewers in another order", () => {
    assert.equal(
      describeMismatch(["v1::A", "v2::B"], ["v2::B", "v1::A"]),
      "order changed during setup: v1::A, v2::B became v2::B, v1::A"
    );
  });
});

describe("the hire's viewer list", () => {
  const installModel = useModel();
  let restoreFakes;

  afterEach(() => {
    if (restoreFakes) {
      restoreFakes();
      restoreFakes = undefined;
    }
  });

  function hire(viewer2Inventory) {
    const fixture = buildGame({
      aiInUse: "Titans",
      enemyType: "guardians",
      perPlayerTech: true,
    });
    const clients = withTwoViewers(
      fixture.game,
      makeInventory({}),
      viewer2Inventory,
      ["A", "B"]
    );
    installModel(fixture.game, clients);
    restoreFakes = installRefereeFakes({
      fileListByPath: { "/pa/ai/": ["/pa/ai/fabber_builds/x.json"] },
      getJSON: () => ({ build_list: [{ to_build: "Bot", builders: [] }] }),
    }).restore;

    const referee = { files: () => ({}) };
    return refereeAi.call(referee).then(() => referee);
  }

  it("records each viewer's key in the order their trees are numbered", () =>
    hire(makeInventory({})).then((referee) => {
      assert.deepEqual(referee.hireClientKeys, ["v1::A", "v2::B"]);
    }));

  it("leaves out a viewer with no record, as the trees do", () =>
    hire(undefined).then((referee) => {
      assert.deepEqual(referee.hireClientKeys, ["v1::A"]);
    }));
});
