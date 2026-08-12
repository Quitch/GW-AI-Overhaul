"use strict";

// A viewer's selection surviving a host move. The base game writes the
// destination into the selection before replaying the move, because move()
// reads it from there, so the only place to put a viewer's own choice back is
// after the replayed action settles.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");

const {
  loadCouiModule,
  requireShippedModule,
} = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const { makeDeferred } = require("../scripts/lib/fake-jquery.js");

const ENTRY =
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_selection_follow.js";

const makeFactory = loadCouiModule(ENTRY);
const { followsHost } = requireShippedModule(ENTRY);

function observable(initial) {
  const subscribers = [];
  const accessor = function () {
    if (arguments.length) {
      accessor.value = arguments[0];
      subscribers.forEach((fn) => fn(accessor.value));
      return undefined;
    }
    return accessor.value;
  };
  accessor.value = initial;
  accessor.subscribe = (fn) => subscribers.push(fn);
  return accessor;
}

function setup(overrides = {}) {
  const options = Object.assign({ hostStar: 0, selected: 0 }, overrides);

  const calls = { applied: [] };
  const stubs = createGlobalStubs();
  const selection = observable(options.selected);
  let pending;

  const game = { currentStar: () => options.hostStar };

  stubs.setGlobal("model", {
    gwCampaignReplayingAction: false,
    selection: { star: selection },
    applyCampaignAction: (action) => {
      calls.applied.push(action);
      pending = makeDeferred();
      return pending.promise();
    },
  });

  makeFactory({ game });

  // What the base game does when a host move arrives: write the destination
  // into the selection under the replay flag, then resolve.
  const replayMove = (destination) => {
    const applying = model.applyCampaignAction({ type: "move_to_star" });
    model.gwCampaignReplayingAction = true;
    selection(destination);
    model.gwCampaignReplayingAction = false;
    options.hostStar = destination;
    return {
      applying,
      settle: () => pending.resolve(),
      fail: () => pending.reject("replay failed"),
    };
  };

  return {
    calls,
    options,
    selection,
    replayMove,
    restore: () => stubs.restoreGlobals(),
  };
}

let active;

afterEach(() => {
  if (active) {
    active.restore();
    active = undefined;
  }
});

function build(overrides) {
  active = setup(overrides);
  return active;
}

describe("following the host", () => {
  it("counts no selection, and the host's own star, as following", () => {
    assert.equal(followsHost(3, 3), true);
    assert.equal(followsHost(-1, 3), true);
    assert.equal(followsHost(undefined, 3), true);
    assert.equal(followsHost(null, 3), true);
    assert.equal(followsHost(4, 3), false);
    assert.equal(followsHost(0, 3), false);
  });
});

describe("a viewer that has not chosen a star", () => {
  it("lets the host's move take the selection with it", async () => {
    const { replayMove, selection } = build();

    const move = replayMove(2);
    move.settle();
    await move.applying;

    assert.equal(selection(), 2);
  });
});

describe("a viewer that has chosen a star", () => {
  it("gets its own selection back after the host moves", async () => {
    const { replayMove, selection } = build();

    selection(5);
    const move = replayMove(2);
    assert.equal(selection(), 2, "the replay needs the destination selected");

    move.settle();
    await move.applying;

    assert.equal(selection(), 5);
  });

  // Otherwise a failed replay strands the viewer looking at the host's
  // destination.
  it("keeps its selection when a replayed action fails", async () => {
    const { replayMove, selection } = build();

    selection(5);
    const move = replayMove(2);
    move.fail();
    await move.applying.then(
      () => {},
      () => {},
    );

    assert.equal(selection(), 5);
  });

  // Whatever the viewer picked most recently is what it gets back.
  it("restores the newest choice, not the one it started the move with", async () => {
    const { replayMove, selection } = build();

    selection(5);
    const move = replayMove(2);
    selection(7);
    move.settle();
    await move.applying;

    assert.equal(selection(), 7);
  });

  it("follows the host again once it selects the host's star", async () => {
    const { replayMove, selection } = build();

    selection(5);
    selection(0);

    const move = replayMove(2);
    move.settle();
    await move.applying;

    assert.equal(selection(), 2);
  });

  // A viewer that selected the star the host is moving to is already where it
  // wanted to be.
  it("leaves a selection that the host has now moved onto", async () => {
    const { replayMove, selection } = build();

    selection(2);
    const move = replayMove(2);
    move.settle();
    await move.applying;

    assert.equal(selection(), 2);
  });
});
