"use strict";

// gw_play/victory_wait_state.js: when the host may end a won co-op war. The
// scene bootstrap, gw_play/victory_wait.js, injects the HTML and has no test of
// its own. See docs/testing.md.

const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert/strict");

const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const {
  makeObservable,
  makeObservableArray,
} = require("../scripts/lib/fake-knockout.js");

const createVictoryWait = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/victory_wait_state.js"
);

const host = { id: 1, name: "Host", role: "host", loading: false };
const viewer = (overrides) =>
  Object.assign(
    { id: 2, name: "Viewer", role: "viewer", loading: false },
    overrides
  );

let deps;
let state;
let done;

beforeEach(() => {
  done = 0;
  deps = {
    visible: makeObservable(false),
    message: makeObservable(""),
    connectedClients: makeObservableArray([host]),
    maxClients: makeObservable(1),
    connected: makeObservable(true),
    battleClients: 1,
  };
  deps.expectedFromBattle = () => deps.battleClients;
  deps.labels = { message: (back, of) => `${back} of ${of}` };
  state = createVictoryWait(deps);
});

const wait = () => state.wait(() => done++);

describe("ready at once", () => {
  it("skips the modal for a solo war", () => {
    wait();
    assert.equal(done, 1);
    assert.equal(deps.visible(), false);
  });

  it("skips the modal when everyone is already back", () => {
    deps.battleClients = 2;
    deps.connectedClients([host, viewer()]);
    wait();
    assert.equal(done, 1);
    assert.equal(deps.visible(), false);
  });
});

describe("waiting", () => {
  it("shows the modal while a player is missing, and ends when they return", () => {
    deps.battleClients = 2;
    wait();
    assert.equal(done, 0);
    assert.equal(deps.visible(), true);
    assert.equal(deps.message(), "1 of 2");

    deps.connectedClients.push(viewer());

    assert.equal(done, 1);
    assert.equal(deps.visible(), false);
  });

  it("waits while a present viewer is still loading", () => {
    deps.battleClients = 2;
    const back = viewer({ loading: true });
    deps.connectedClients([host, back]);
    wait();
    assert.equal(done, 0);
    assert.equal(deps.message(), "1 of 2");

    back.loading = false;
    deps.connectedClients.valueHasMutated();

    assert.equal(done, 1);
  });

  it("waits while a present viewer is picking a loadout", () => {
    deps.battleClients = 2;
    deps.connectedClients([
      host,
      viewer({ loading_status: "picking_loadout" }),
    ]);
    wait();
    assert.equal(done, 0);

    deps.connectedClients([host, viewer({ loading_status: "ready" })]);

    assert.equal(done, 1);
  });

  it("waits while a present viewer still owes a loadout", () => {
    deps.battleClients = 2;
    deps.connectedClients([host, viewer({ requires_loadout: true })]);
    wait();
    assert.equal(done, 0);
  });

  it("waits for the campaign server before deciding", () => {
    deps.connected(false);
    wait();
    assert.equal(done, 0);
    assert.equal(deps.visible(), true);

    deps.connected(true);

    assert.equal(done, 1);
  });
});

// Stock restores max_clients from the battle count over an async round trip,
// so whichever of the two is known first sets the target.
describe("the expected count", () => {
  it("uses the battle count while the lobby still reads one", () => {
    deps.battleClients = 3;
    deps.connectedClients([host, viewer()]);
    wait();
    assert.equal(done, 0);
    assert.equal(deps.message(), "2 of 3");
  });

  it("uses the lobby size when the battle count is absent", () => {
    deps.battleClients = undefined;
    deps.maxClients(2);
    wait();
    assert.equal(done, 0);
    assert.equal(deps.message(), "1 of 2");

    deps.connectedClients.push(viewer());

    assert.equal(done, 1);
  });

  it("follows the lobby size when it changes mid-wait", () => {
    deps.battleClients = undefined;
    deps.maxClients(3);
    wait();
    assert.equal(deps.message(), "1 of 3");

    deps.maxClients(1);

    assert.equal(done, 1);
  });
});

describe("cancel", () => {
  it("ends the wait once", () => {
    deps.battleClients = 2;
    wait();
    state.cancel();
    state.cancel();
    assert.equal(done, 1);
    assert.equal(deps.visible(), false);
  });

  it("does nothing when nothing is waiting", () => {
    state.cancel();
    assert.equal(done, 0);
  });
});

describe("after completion", () => {
  it("ignores later client changes", () => {
    deps.battleClients = 2;
    wait();
    deps.connectedClients.push(viewer());
    assert.equal(done, 1);

    deps.connectedClients([host]);
    deps.connectedClients([host, viewer()]);

    assert.equal(done, 1);
    assert.equal(deps.visible(), false);
  });

  it("ignores a second wait while one is running", () => {
    deps.battleClients = 2;
    wait();
    state.wait(() => {
      done += 10;
    });
    deps.connectedClients.push(viewer());
    assert.equal(done, 1);
  });
});
