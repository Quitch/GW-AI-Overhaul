"use strict";

// The two operator handlers gw_play/coop_ping_operators.js registers - the
// host's, which relays a viewer's ping to everyone, and the viewer's, which
// renders one - plus the send path the Ping button drives. None is returned by
// the factory, so the handlers are captured off the model stub.
//
// The validation, cooldown and labelling helpers are pinned as pure functions
// in coop_ping.test.js.

const { describe, it, before, after, afterEach } = require("node:test");
const assert = require("node:assert/strict");

const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");

const makeFactory = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_ping_operators.js",
);

const REQUEST = "gwo_ping_star";
const BROADCAST = "gwo_ping_star_broadcast";

function observable(initial) {
  let value = initial;
  return function () {
    if (arguments.length) {
      value = arguments[0];
      return undefined;
    }
    return value;
  };
}

function setup(overrides = {}) {
  const options = Object.assign(
    {
      isHost: true,
      connected: true,
      canSend: true,
      starCount: 3,
      selected: 1,
      displayName: "Alice",
      onCooldown: false,
      isViewer: true,
      hostActionButtons: false,
      hidingUI: false,
      explored: false,
      turnState: "begin",
      scanning: false,
      pendingTechRecords: [],
    },
    overrides,
  );

  const calls = {
    viewerOperators: [],
    hostOperators: [],
    raised: [],
    sounds: [],
    chat: [],
    cooldown: [],
  };
  const handlers = {};

  const stubs = createGlobalStubs();
  stubs.setGlobal("api", {
    audio: { playSound: (cue) => calls.sounds.push(cue) },
  });

  const onCooldown = observable(options.onCooldown);
  stubs.setGlobal("model", {
    isCampaignHost: () => options.isHost,
    isCampaignViewer: () => options.isViewer,
    canShowCampaignActionButtons: () => options.hostActionButtons,
    hidingUI: () => options.hidingUI,
    scanning: () => options.scanning,
    // The base game's own dispatch: the branch named by the turn state, or the
    // default when it names none.
    testGameState: (states, fallback) => {
      const branch = states[options.turnState];
      if (branch === undefined) {
        return fallback;
      }
      return typeof branch === "function" ? branch() : branch;
    },
    gwCampaignConnected: () => options.connected,
    displayName: () => options.displayName,
    selection: { star: () => options.selected },
    gwoPingOnCooldown: function () {
      if (arguments.length) {
        calls.cooldown.push(arguments[0]);
      }
      return onCooldown.apply(null, arguments);
    },
    addCampaignChatMessage: (name, message, markUnread) =>
      calls.chat.push([name, message, markUnread]),
    registerCampaignViewerOperatorHandler: (name, fn) => {
      handlers[name] = fn;
    },
    registerCampaignHostOperatorHandler: (name, fn) => {
      handlers[name] = fn;
    },
    sendCampaignViewerOperator: (name, payload) => {
      calls.viewerOperators.push([name, payload]);
      return options.canSend;
    },
    sendCampaignHostOperator: function (name, payload) {
      calls.hostOperators.push([name, payload, arguments[2]]);
      return true;
    },
  });

  const api = makeFactory({
    marker: { raise: (star) => calls.raised.push(star) },
    systemFor: (star) =>
      star >= 0 && star < options.starCount
        ? { star: { explored: () => options.explored } }
        : undefined,
    starCount: () => options.starCount,
    starName: (star) => "System " + star,
    pendingTechRecords: () => options.pendingTechRecords,
  });

  return {
    api,
    handlers,
    calls,
    options,
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

const request = (extra) =>
  Object.assign(
    {
      client_id: "abc",
      client_name: "Alice",
      payload: { star: 1, ping_id: "p1" },
    },
    extra,
  );

const broadcast = (extra) => ({
  payload: Object.assign(
    { star: 1, ping_id: "p1", client_id: "abc", client_name: "Alice" },
    extra,
  ),
});

function captureLogs(run) {
  const logs = [];
  const priorLog = console.log;
  console.log = (message) => logs.push(message);
  try {
    run();
  } finally {
    console.log = priorLog;
  }
  return logs;
}

describe("ping relay - refusals", () => {
  it("registers a handler for each direction", () => {
    const { handlers } = build();
    assert.equal(typeof handlers[REQUEST], "function");
    assert.equal(typeof handlers[BROADCAST], "function");
  });

  // A ping mutates no campaign state, so it must not be queued ahead of the
  // authoritative updates that do.
  it("hands the campaign queue nothing to wait on", () => {
    const { handlers, calls } = build();
    assert.equal(handlers[REQUEST](request()), undefined);
    assert.equal(handlers[BROADCAST](broadcast({ ping_id: "p2" })), undefined);
    assert.equal(calls.raised.length, 2);
  });

  // The file loads on every client, so a viewer registers the host handler too.
  it("relays nothing when this client is not a connected host", () => {
    for (const off of [{ isHost: false }, { connected: false }]) {
      const { handlers, calls } = build(off);
      handlers[REQUEST](request());
      assert.deepEqual(calls.hostOperators, [], JSON.stringify(off));
      assert.deepEqual(calls.raised, []);
      active.restore();
      active = undefined;
    }
  });

  it("drops a ping it cannot make sense of", () => {
    for (const payload of [
      undefined,
      {},
      { star: 9, ping_id: "p1" },
      { star: 1 },
    ]) {
      const { handlers, calls } = build();
      const logs = captureLogs(() => handlers[REQUEST](request({ payload })));
      assert.deepEqual(calls.hostOperators, [], JSON.stringify(payload));
      assert.deepEqual(calls.raised, []);
      assert.equal(logs.length, 1);
      assert.match(logs[0], /dropped ping/);
      active.restore();
      active = undefined;
    }
  });

  it("drops a second ping from the same client too soon after the first", () => {
    const { handlers, calls } = build();

    handlers[REQUEST](request());
    captureLogs(() =>
      handlers[REQUEST](request({ payload: { star: 2, ping_id: "p2" } })),
    );

    assert.equal(calls.hostOperators.length, 1);
  });

  it("lets a different client ping in the same moment", () => {
    const { handlers, calls } = build();

    handlers[REQUEST](request());
    handlers[REQUEST](request({ client_id: "def", client_name: "Bob" }));

    assert.equal(calls.hostOperators.length, 2);
  });

  // Two unauthenticated viewers cannot be told apart, so they share a bucket -
  // but a name is enough to separate them.
  it("separates unauthenticated viewers by name alone", () => {
    const { handlers, calls } = build();

    handlers[REQUEST](request({ client_id: "" }));
    handlers[REQUEST](request({ client_id: "", client_name: "Bob" }));
    captureLogs(() => handlers[REQUEST](request({ client_id: "" })));

    assert.equal(calls.hostOperators.length, 2);
  });
});

describe("ping relay - the relay", () => {
  it("sends the ping on to every viewer and shows it to the host", () => {
    const { handlers, calls } = build();

    handlers[REQUEST](request());

    const sent = calls.hostOperators[0];
    assert.equal(sent[0], BROADCAST);
    assert.deepEqual(sent[1], {
      star: 1,
      ping_id: "p1",
      client_id: "abc",
      client_name: "Alice",
    });
    // No target and no options: the relay reads that as all connected viewers.
    assert.equal(sent[2], undefined);

    assert.deepEqual(calls.raised, [1]);
    assert.deepEqual(calls.sounds, ["/SE/UI/UI_ping"]);
    assert.deepEqual(calls.chat, [["Alice", "!LOC:Ping! System 1", true]]);
  });

  it("labels a ping from a viewer the game never named", () => {
    const { handlers, calls } = build();
    handlers[REQUEST](request({ client_name: "" }));
    assert.equal(calls.chat[0][0], "!LOC:Unknown");
  });
});

describe("ping broadcast handler", () => {
  it("raises the marker, plays the cue and posts an unread chat line", () => {
    const { handlers, calls } = build({ isHost: false });

    handlers[BROADCAST](broadcast());

    assert.deepEqual(calls.raised, [1]);
    assert.deepEqual(calls.sounds, ["/SE/UI/UI_ping"]);
    assert.deepEqual(calls.chat, [["Alice", "!LOC:Ping! System 1", true]]);
  });

  // A viewer part-way through a rehydrate can be behind the host's galaxy.
  it("ignores a ping naming a star this client does not have", () => {
    const { handlers, calls } = build({ isHost: false, starCount: 1 });

    const logs = captureLogs(() => handlers[BROADCAST](broadcast()));

    assert.deepEqual(calls.raised, []);
    assert.match(logs[0], /ignored ping/);
  });

  // Pings from different clients can land together, so the cue is throttled
  // separately from the per-client cooldown.
  it("shows both of two pings that land together but only sounds one", () => {
    const { handlers, calls } = build({ isHost: false });

    handlers[BROADCAST](broadcast());
    handlers[BROADCAST](broadcast({ ping_id: "p2", client_name: "Bob" }));

    assert.deepEqual(calls.raised, [1, 1]);
    assert.equal(calls.chat.length, 2);
    assert.deepEqual(calls.sounds, ["/SE/UI/UI_ping"]);
  });
});

describe("what can be pinged", () => {
  it("allows a star that is still out there to be taken", () => {
    const { api } = build();
    assert.equal(api.canPing(1), true);
  });

  // An explored star has been taken: there is nothing left there to ask the
  // host for.
  it("refuses a star that has been explored", () => {
    const { api } = build({ explored: true });
    assert.equal(api.canPing(1), false);
  });

  it("refuses a star index the galaxy does not have", () => {
    const { api } = build();
    for (const star of [-1, 3, 1.5, "1", undefined]) {
      assert.equal(api.canPing(star), false, String(star));
    }
  });

  // Where the host goes next stops being a question once they have committed
  // to an explore or a fight.
  it("refuses while an explore or a fight is running", () => {
    for (const turnState of ["explore", "fight"]) {
      const { api } = build({ turnState });
      assert.equal(api.canPing(1), false, turnState);
      active.restore();
      active = undefined;
    }
  });

  // The turn state only returns to begin on the next move, so a finished
  // exploration rests at end - which is exactly when where to go next matters.
  it("allows a ping once the star is finished with", () => {
    const { api } = build({ turnState: "end" });
    assert.equal(api.canPing(1), true);
  });

  it("refuses while the scanning overlay is up", () => {
    const { api } = build({ scanning: true });
    assert.equal(api.canPing(1), false);
  });

  // Under per-player tech the turn state is back to begin while viewers are
  // still choosing, so the records are the only thing that says so.
  it("refuses while anybody still holds a tech offer", () => {
    const { api } = build({
      pendingTechRecords: [
        undefined,
        { pendingTechCards: undefined },
        { pendingTechCards: { star: 2, cards: [{ id: "a" }] } },
      ],
    });
    assert.equal(api.canPing(1), false);
  });

  it("allows a ping once every offer is resolved", () => {
    const { api } = build({
      pendingTechRecords: [undefined, { pendingTechCards: undefined }, {}],
    });
    assert.equal(api.canPing(1), true);
  });

  it("refuses anyone who is not a connected viewer", () => {
    for (const off of [
      { isViewer: false },
      { connected: false },
      { hostActionButtons: true },
      { hidingUI: true },
    ]) {
      const { api } = build(off);
      assert.equal(api.canPing(1), false, JSON.stringify(off));
      active.restore();
      active = undefined;
    }
  });
});

describe("sending a ping", () => {
  // The cooldown is cleared on a _.delay. node:test's timer mocks cannot reach
  // it - lodash 3 binds context.setTimeout once, at load - so the delay is
  // captured by swapping the global lodash for one bound to a recording
  // setTimeout, as cards_coop_reroll_factory.test.js does.
  const delayed = [];
  let realLodash;

  before(() => {
    realLodash = global._;
    global._ = realLodash.runInContext({
      setTimeout: (fn, wait) => delayed.push({ fn, wait }),
    });
  });

  after(() => {
    global._ = realLodash;
  });

  afterEach(() => {
    delayed.length = 0;
  });

  it("asks the host, then shows the ping without waiting for the answer", () => {
    const { api, calls } = build();

    api.pingStar();

    assert.equal(calls.viewerOperators.length, 1);
    assert.equal(calls.viewerOperators[0][0], REQUEST);
    assert.equal(calls.viewerOperators[0][1].star, 1);
    assert.equal(typeof calls.viewerOperators[0][1].ping_id, "string");
    assert.deepEqual(calls.raised, [1]);
    assert.deepEqual(calls.chat, [["Alice", "!LOC:Ping! System 1", true]]);
  });

  // Otherwise the pinger draws its own marker twice.
  it("ignores the relay coming back around", () => {
    const { api, handlers, calls } = build();

    api.pingStar();
    const pingId = calls.viewerOperators[0][1].ping_id;
    handlers[BROADCAST](broadcast({ ping_id: pingId }));

    assert.deepEqual(calls.raised, [1]);
  });

  it("still shows somebody else's ping", () => {
    const { api, handlers, calls } = build();

    api.pingStar();
    handlers[BROADCAST](broadcast({ ping_id: "somebody-else" }));

    assert.deepEqual(calls.raised, [1, 1]);
  });

  it("holds the button shut until the cooldown expires", () => {
    const { api, calls } = build();

    api.pingStar();
    assert.deepEqual(calls.cooldown, [true]);

    assert.equal(delayed.length, 1);
    assert.equal(delayed[0].wait, 3000);
    delayed[0].fn();
    assert.deepEqual(calls.cooldown, [true, false]);
  });

  it("does nothing while the cooldown is still running", () => {
    const { api, calls } = build({ onCooldown: true });

    api.pingStar();

    assert.deepEqual(calls.viewerOperators, []);
    assert.deepEqual(calls.raised, []);
  });

  it("does not ping a star that is not in the galaxy", () => {
    const { api, calls } = build({ selected: -1 });

    api.pingStar();

    assert.deepEqual(calls.viewerOperators, []);
    assert.deepEqual(calls.raised, []);
  });

  // The button is hidden for these, but a click landing as the war moves on
  // must not get through either.
  it("does not ping a star the button would not offer", () => {
    const { api, calls } = build({ explored: true });

    api.pingStar();

    assert.deepEqual(calls.viewerOperators, []);
    assert.deepEqual(calls.raised, []);
  });

  // A viewer whose session has dropped: nothing was sent, so nothing is shown
  // and the button stays live.
  it("shows nothing when the request could not be sent", () => {
    const { api, calls } = build({ canSend: false });

    api.pingStar();

    assert.equal(calls.viewerOperators.length, 1);
    assert.deepEqual(calls.raised, []);
    assert.deepEqual(calls.cooldown, []);
    assert.equal(delayed.length, 0);
  });
});
