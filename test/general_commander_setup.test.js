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
    const timers = [];
    const pending = makeObservable(false);
    const request = setup.viewerRequest({
      pending,
      wait: (fn) => timers.push(fn),
      ready: () => state.ready,
      record: () => state.record,
      transmit: () => {
        sent.push(pending.peek());
        return state.transmits;
      },
    });
    const fireTimers = () => timers.splice(0).forEach((fn) => fn());
    return { state, sent, pending, request, fireTimers };
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

  // A host with no handler registered yet only logs the request, so no answer
  // comes back to lower pending.
  it("sends again when the host never answers", () => {
    const { sent, pending, request, fireTimers } = viewer();

    request.send();
    fireTimers();
    assert.equal(sent.length, 2);
    assert.equal(pending(), true);
  });

  it("does not resend once the host has answered", () => {
    const { sent, request, fireTimers } = viewer();

    request.send();
    request.answer();
    fireTimers();
    assert.equal(sent.length, 1);
  });

  it("does not resend when the viewer is no longer ready at the timeout", () => {
    const { state, sent, pending, request, fireTimers } = viewer();

    request.send();
    state.ready = false;
    fireTimers();
    assert.equal(sent.length, 1);
    assert.equal(pending(), false);
  });

  // A request sent before a disconnect went with the connection, so the
  // reconnect must be free to send it again.
  it("treats a request as lost when the viewer stops being ready", () => {
    const { state, sent, pending, request } = viewer();

    request.send();
    state.ready = false;
    assert.equal(request.send(), false);
    assert.equal(pending(), false);
    state.ready = true;
    assert.equal(request.send(), true);
    assert.equal(sent.length, 2);
  });

  it("ignores the timer of a request that was already replaced", () => {
    const { state, sent, request, fireTimers } = viewer();

    request.send();
    state.ready = false;
    request.send();
    state.ready = true;
    request.send();
    fireTimers();
    assert.equal(sent.length, 3, "only the newest request's timer resends");
  });

  // A host that never handles the request, such as one on an older GWO, would
  // otherwise be sent it every retryMs for as long as the viewer stays.
  it("stops resending after three unanswered retries", () => {
    const { sent, pending, request, fireTimers } = viewer();

    request.send();
    fireTimers();
    fireTimers();
    fireTimers();
    fireTimers();
    fireTimers();
    assert.equal(sent.length, 4);
    assert.equal(pending(), false);
  });

  it("gives a reconnect a fresh set of retries", () => {
    const { state, sent, request, fireTimers } = viewer();

    request.send();
    fireTimers();
    fireTimers();
    fireTimers();
    fireTimers();
    state.ready = false;
    request.send();
    state.ready = true;
    request.send();
    fireTimers();
    assert.equal(sent.length, 6);
  });
});
