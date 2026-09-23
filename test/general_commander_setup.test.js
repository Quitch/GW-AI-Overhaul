"use strict";

// gw_play/general_commander_setup.js: when a co-op viewer asks the host for its
// General Commander Sub Commanders, and when the host may write the result.
// The factory in cards_start_subcdr.js is the glue around these.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { makeObservable } = require("../scripts/lib/fake-knockout.js");

const setup = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/general_commander_setup.js"
);

const unset = () => ({ inventory: { cards: [{ id: "gwc_start_subcdr" }] } });
const dealt = () => ({
  inventory: {
    cards: [
      { id: "gwc_start_subcdr", minions: [] },
      { id: "gwc_minion" },
      { id: "gwc_minion" },
    ],
  },
});

describe("needsSetup", () => {
  it("is true only for a lone General Commander card with no minions", () => {
    assert.equal(setup.needsSetup([{ id: "gwc_start_subcdr" }]), true);
    assert.equal(
      setup.needsSetup([{ id: "gwc_start_subcdr", minions: [] }]),
      false
    );
    assert.equal(setup.needsSetup(dealt().inventory.cards), false);
    assert.equal(setup.needsSetup([{ id: "gwc_start_bot" }]), false);
    assert.equal(setup.needsSetup([]), false);
    assert.equal(setup.needsSetup(undefined), false);
  });

  it("reads a record's inventory, and tolerates a record with none", () => {
    assert.equal(setup.recordNeedsSetup(unset()), true);
    assert.equal(setup.recordNeedsSetup(dealt()), false);
    assert.equal(setup.recordNeedsSetup({}), false);
    assert.equal(setup.recordNeedsSetup(undefined), false);
  });
});

describe("viewerRequest", () => {
  // The state a viewer's gw_play can be in when the request is first tried,
  // and what the request sent.
  function viewer(overrides = {}) {
    const state = Object.assign(
      { ready: true, record: unset(), transmits: true },
      overrides
    );
    const sent = [];
    const pending = makeObservable(false);
    const request = setup.viewerRequest({
      pending,
      ready: () => state.ready,
      record: () => state.record,
      transmit: () => {
        sent.push(pending.peek());
        return state.transmits;
      },
    });
    return { state, sent, pending, request };
  }

  it("sends once the viewer is ready and its record needs setup", () => {
    const { sent, pending, request } = viewer();

    assert.equal(request.send(), true);
    assert.deepEqual(sent, [true], "pending is raised before the send");
    assert.equal(pending(), true);
  });

  // gw_play can load before the connection or the per-player tech sync. The
  // caller runs send() again when either arrives, so nothing is lost by an
  // early try.
  it("waits for the connection and the tech sync, then sends", () => {
    const { state, sent, request } = viewer({ ready: false });

    assert.equal(request.send(), false);
    state.ready = true;
    assert.equal(request.send(), true);
    assert.equal(sent.length, 1);
  });

  it("sends nothing for a record that needs no setup", () => {
    const { sent, request } = viewer({ record: dealt() });

    assert.equal(request.send(), false);
    assert.deepEqual(sent, []);
  });

  it("sends nothing more while a request is waiting for its answer", () => {
    const { sent, request } = viewer();

    request.send();
    assert.equal(request.send(), false);
    assert.equal(sent.length, 1);
  });

  // The engine refuses to send while the viewer is not connected. Leaving the
  // flag raised would block every later try.
  it("lowers pending when the send is refused, so a later try can send", () => {
    const { state, sent, pending, request } = viewer({ transmits: false });

    assert.equal(request.send(), false);
    assert.equal(pending(), false);
    state.transmits = true;
    assert.equal(request.send(), true);
    assert.equal(sent.length, 2);
  });

  // A host that refuses, or answers that nothing changed, would otherwise be
  // asked again on every change to the record.
  it("sends nothing again once the host has answered", () => {
    const { sent, pending, request } = viewer();

    request.send();
    request.answer();
    assert.equal(pending(), false);
    assert.equal(request.send(), false);
    assert.equal(sent.length, 1);
  });
});
