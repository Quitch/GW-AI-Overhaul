"use strict";

// gw_play/coop_ai_lobby.js: the host adding a co-op AI player into an open slot
// and kicking one. The server is played by hand: a test answers each
// modify_settings the factory sends. See coop.md, "AI players".

const { describe, it, mock } = require("node:test");
const assert = require("node:assert/strict");

const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const {
  createGlobalStubs,
  trackActive,
} = require("../scripts/lib/global-stubs.js");
const {
  makeObservable: observable,
  makeObservableArray: observableArray,
} = require("../scripts/lib/fake-knockout.js");
const {
  installFakeJQuery,
  rejected,
  resolved,
} = require("../scripts/lib/fake-jquery.js");
const { aiRecord } = require("../scripts/lib/coop-ai-fixtures.js");

const makeLobby = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_ai_lobby.js"
);

const HOST = { id: "host", name: "Host", role: "host" };
const VIEWER = { id: "v1", name: "Viewer", role: "viewer" };

function setup(overrides) {
  const options = Object.assign(
    {
      isHost: true,
      active: true,
      perPlayerTech: false,
      max: 3,
      connected: [HOST],
      restartPending: false,
      victoryWaiting: false,
      initialApplied: true,
      control: { max_clients: 3 },
      launching: false,
      setupBlocked: false,
      locked: false,
      ready: true,
      records: [],
      refuseUpsert: false,
      createThrows: false,
      saveFails: false,
    },
    overrides
  );

  const calls = {
    sent: [],
    applied: [],
    queued: [],
    snapshots: [],
    saves: 0,
    log: [],
  };

  const stubs = createGlobalStubs();
  installFakeJQuery(stubs);
  const logMock = mock.method(console, "log", (line) => calls.log.push(line));
  const errorMock = mock.method(console, "error", (line) =>
    calls.log.push(line)
  );

  const max = observable(options.max);
  const records = observableArray(options.records.slice());
  const restartContext = observable(
    options.restartPending ? { pending_reapply: true } : undefined
  );

  const model = {
    isCampaignHost: () => options.isHost,
    gwCampaignActive: () => options.active,
    gwCampaignPerPlayerTechCards: () => options.perPlayerTech,
    gwCampaignMaxClients: max,
    gwCampaignConnectedClients: () => options.connected,
    gwCampaignRestartContext: restartContext,
    gwCampaignControl: () => options.control,
    gwoVictoryWait: { visible: () => options.victoryWaiting },
    initialCoopSettingsApplied: options.initialApplied,
    launchingFight: () => options.launching,
    gwCampaignPlayerSetupBlocked: () => options.setupBlocked,
    savedCoopPlayersLocked: () => options.locked,
    buildCampaignLobbySettingsPayload: (count) => ({
      max_clients: count,
      // What the wrapped savedCoopPlayers says when the payload is built.
      aiRecords: records().length,
    }),
    send_message: (message, payload, respond) => {
      calls.sent.push({
        message,
        payload,
        respond,
        recordsWhenSent: records().length,
      });
    },
    applyCampaignLobbyControl: (response) => {
      calls.applied.push(response);
      max(response.max_clients);
    },
    enqueueGwCampaignStateApply: (label, apply) => {
      calls.queued.push(label);
      return apply();
    },
    sendCampaignSnapshot: (reason, force) => {
      calls.snapshots.push({ reason, force });
      return true;
    },
  };
  stubs.setGlobal("model", model);

  const gwaio = {};
  const game = {
    coopPlayerInventoryData: records,
    upsertCoopPlayerInventoryData: (record) => {
      if (options.refuseUpsert) {
        return false;
      }
      records.push(record);
      return true;
    },
  };

  const state = {
    ready: observable(options.ready),
    busy: observable(false),
    armed: observable(),
    inFlight: observable(0),
  };

  const lobby = makeLobby({
    game: game,
    gwaio: () => gwaio,
    createRecord: (identity) => {
      if (options.createThrows) {
        throw new Error("no commander");
      }
      return aiRecord(identity.serial);
    },
    save: () => {
      calls.saves += 1;
      return options.saveFails ? rejected("disk full") : resolved();
    },
    ready: state.ready,
    busy: state.busy,
    armed: state.armed,
    inFlight: state.inFlight,
  });

  // The server's answer to the last modify_settings sent.
  const reply = (success, response) => {
    const last = calls.sent[calls.sent.length - 1];
    last.respond(success, response);
  };

  return {
    lobby,
    model,
    options,
    calls,
    state,
    gwaio,
    records,
    max,
    restartContext,
    reply,
    restore: () => {
      logMock.mock.restore();
      errorMock.mock.restore();
      stubs.restoreGlobals();
    },
  };
}

const active = trackActive(setup);

describe("canAddAi", () => {
  it("lets the host fill an open slot in a settled lobby", () => {
    assert.equal(active.build().lobby.canAddAi(), true);
  });

  const REFUSALS = {
    "a viewer": { isHost: false },
    "no session": { active: false },
    "per-player tech, until it is supported": { perPlayerTech: true },
    "no open slot": { connected: [HOST, VIEWER, VIEWER], max: 3 },
    "a battle launching": { launching: true },
    "a player mid-setup": { setupBlocked: true },
    "the victory wait open": { victoryWaiting: true },
    "the restart re-apply pending": { restartPending: true },
    "the saved settings not applied yet": { initialApplied: false },
    "no max_clients from the server yet": { control: {} },
    "the AI modules not loaded": { ready: false },
  };
  for (const [reason, overrides] of Object.entries(REFUSALS)) {
    it(`refuses with ${reason}`, () => {
      assert.equal(active.build(overrides).lobby.canAddAi(), false);
    });
  }

  // gwCampaignMaxClients cannot be trusted while the server has not answered a
  // modify_settings - stock's restart re-apply among them.
  it("refuses while a modify_settings is in flight", () => {
    const run = active.build();
    run.state.inFlight(1);
    assert.equal(run.lobby.canAddAi(), false);
    run.state.inFlight(0);
    assert.equal(run.lobby.canAddAi(), true);
  });

  it("refuses while another add or kick is under way", () => {
    const run = active.build();
    run.state.busy(true);
    assert.equal(run.lobby.canAddAi(), false);
  });
});

describe("addAi", () => {
  it("asks the server for one slot fewer and writes nothing before it answers", () => {
    const run = active.build();

    assert.equal(run.lobby.addAi(), true);
    assert.equal(run.calls.sent.length, 1);
    assert.equal(run.calls.sent[0].message, "modify_settings");
    assert.equal(run.calls.sent[0].payload.max_clients, 2);
    assert.equal(run.records().length, 0);
    assert.equal(run.state.busy(), true);
    assert.equal(run.lobby.canAddAi(), false);
  });

  it("writes the AI through the state queue once the slot is taken", () => {
    const run = active.build({ connected: [HOST, VIEWER] });
    run.lobby.addAi();
    run.reply(true, { max_clients: 2 });

    assert.deepEqual(run.calls.applied, [{ max_clients: 2 }]);
    assert.equal(run.max(), 2);
    assert.deepEqual(run.calls.queued, ["gwo_coop_ai_add"]);
    assert.deepEqual(
      run.records().map((record) => record.playerId),
      ["gwo_ai_1"]
    );
    assert.equal(run.gwaio.coopAiSerial, 1);
    assert.equal(run.calls.saves, 1);
    assert.deepEqual(run.calls.snapshots, [
      { reason: "gwo_coop_ai_add", force: true },
    ]);
    assert.equal(run.state.busy(), false);
  });

  // A joining viewer's initial sync asks for a snapshot of its own.
  it("publishes nothing with no viewer to tell", () => {
    const run = active.build();
    run.lobby.addAi();
    run.reply(true, { max_clients: 2 });

    assert.equal(run.records().length, 1);
    assert.deepEqual(run.calls.snapshots, []);
  });

  // The server keeps max_clients at the number connected, so a human who
  // joined meanwhile answers with the old count.
  it("abandons the add when a human took the slot first", () => {
    const run = active.build({ max: 2 });
    run.lobby.addAi();
    run.reply(true, { max_clients: 2 });

    assert.equal(run.records().length, 0);
    assert.deepEqual(run.calls.queued, []);
    assert.deepEqual(run.calls.applied, []);
    assert.equal(run.state.busy(), false);
    assert.equal(run.gwaio.coopAiSerial, undefined);
  });

  it("abandons the add when the server refuses it, and says so", () => {
    const run = active.build();
    run.lobby.addAi();
    run.reply(false, "Only host can modify campaign lobby settings");

    assert.equal(run.records().length, 0);
    assert.equal(run.state.busy(), false);
    assert.deepEqual(run.calls.log, [
      '[GW COOP AI] add refused: "Only host can modify campaign lobby settings"',
    ]);
  });

  it("does nothing when it may not add", () => {
    const run = active.build({ launching: true });
    assert.equal(run.lobby.addAi(), false);
    assert.equal(run.calls.sent.length, 0);
  });

  // The first request carried the lock limit from before the AI; the second
  // carries the one that leaves it out.
  it("sends the same count again under a lock, after the record is written", () => {
    const run = active.build({ locked: true });
    run.lobby.addAi();
    run.reply(true, { max_clients: 2 });

    assert.equal(run.calls.sent.length, 2);
    assert.equal(run.calls.sent[1].payload.max_clients, 2);
    assert.equal(run.calls.sent[1].recordsWhenSent, 1);
  });

  it("gives the slot back when the record cannot be built", () => {
    const run = active.build({ createThrows: true });
    run.lobby.addAi();
    run.reply(true, { max_clients: 2 });

    assert.equal(run.records().length, 0);
    assert.equal(run.calls.sent.length, 2);
    assert.equal(run.calls.sent[1].payload.max_clients, 3);
    assert.equal(run.state.busy(), false);
    assert.equal(run.gwaio.coopAiSerial, undefined);
    assert.equal(run.calls.saves, 0);
  });

  it("says so when the slot cannot be given back", () => {
    const run = active.build({ createThrows: true });
    run.lobby.addAi();
    run.reply(true, { max_clients: 2 });
    run.reply(false, "gone");

    assert.equal(
      run.calls.log[run.calls.log.length - 1],
      '[GW COOP AI] slot not restored: "gone"'
    );
  });

  it("keeps the AI and says so when the war cannot be saved", async () => {
    const run = active.build({ saveFails: true });
    run.lobby.addAi();
    run.reply(true, { max_clients: 2 });
    await new Promise((resolve) => setImmediate(resolve));

    assert.equal(run.records().length, 1);
    assert.ok(
      run.calls.log.includes("[GW COOP AI] war not saved after add: disk full"),
      JSON.stringify(run.calls.log)
    );
  });

  it("gives the slot back when the game refuses the record", () => {
    const run = active.build({ refuseUpsert: true });
    run.lobby.addAi();
    run.reply(true, { max_clients: 2 });

    assert.equal(run.calls.sent.length, 2);
    assert.equal(run.calls.sent[1].payload.max_clients, 3);
    assert.equal(run.state.busy(), false);
  });

  it("numbers each AI with a fresh serial", () => {
    const run = active.build({ max: 4, connected: [HOST] });
    run.lobby.addAi();
    run.reply(true, { max_clients: 3 });
    run.lobby.addAi();
    run.reply(true, { max_clients: 2 });

    assert.deepEqual(
      run.records().map((record) => record.playerId),
      ["gwo_ai_1", "gwo_ai_2"]
    );
    assert.equal(run.gwaio.coopAiSerial, 2);
  });
});

describe("kickAi", () => {
  const ROW = { id: "gwo_ai_1", name: "AI1", gwoAi: true };

  function withAi(overrides) {
    return active.build(
      Object.assign({ max: 2, records: [aiRecord(1), aiRecord(2)] }, overrides)
    );
  }

  // Kicking deletes the AI for good, so the first press only asks.
  it("asks on the first press and kicks on the second", () => {
    const run = withAi();

    assert.equal(run.lobby.kickAi(ROW), false);
    assert.equal(run.state.armed(), "gwo_ai_1");
    assert.equal(run.records().length, 2);
    assert.equal(run.calls.sent.length, 0);

    assert.equal(run.lobby.kickAi(ROW), true);
    assert.equal(run.state.armed(), undefined);
    assert.deepEqual(
      run.records().map((record) => record.playerId),
      ["gwo_ai_2"]
    );
    assert.deepEqual(run.calls.queued, ["gwo_coop_ai_kick"]);
  });

  it("re-asks when another AI's Kick is pressed in between", () => {
    const run = withAi();
    run.lobby.kickAi(ROW);
    run.lobby.kickAi({ id: "gwo_ai_2", name: "AI2", gwoAi: true });

    assert.equal(run.state.armed(), "gwo_ai_2");
    assert.equal(run.records().length, 2);
  });

  // Before the slot comes back, so a lock's limit already counts it.
  it("removes the record before returning the slot, then saves and waits for the server", () => {
    const run = withAi({ connected: [HOST, VIEWER] });
    run.lobby.kickAi(ROW);
    run.lobby.kickAi(ROW);

    assert.equal(run.calls.sent.length, 1);
    assert.equal(run.calls.sent[0].payload.max_clients, 3);
    assert.equal(run.calls.sent[0].recordsWhenSent, 1);
    assert.equal(run.calls.saves, 1);
    assert.deepEqual(run.calls.snapshots, [
      { reason: "gwo_coop_ai_kick", force: true },
    ]);
    assert.equal(run.state.busy(), true);

    run.reply(true, { max_clients: 3 });
    assert.equal(run.state.busy(), false);
  });

  it("clears busy even when the server refuses the slot back", () => {
    const run = withAi();
    run.lobby.kickAi(ROW);
    run.lobby.kickAi(ROW);
    run.reply(false, "no");

    assert.equal(run.state.busy(), false);
    assert.equal(run.records().length, 1);
  });

  it("leaves every record alone for an AI that is already gone", () => {
    const run = withAi();
    const gone = { id: "gwo_ai_9", name: "AI9", gwoAi: true };
    run.lobby.kickAi(gone);
    run.lobby.kickAi(gone);

    assert.equal(run.records().length, 2);
    assert.equal(run.calls.sent.length, 0);
    assert.equal(run.state.busy(), false);
  });

  it("never kicks a human's row", () => {
    const run = withAi();
    const human = { id: "v1", name: "Viewer", canKick: true };
    assert.equal(run.lobby.canKickAi(human), false);
    assert.equal(run.lobby.kickAi(human), false);
    assert.equal(run.lobby.kickAi(human), false);
    assert.equal(run.state.armed(), undefined);
  });

  const REFUSALS = {
    "a viewer": { isHost: false },
    "a battle launching": { launching: true },
    "the restart re-apply pending": { restartPending: true },
  };
  for (const [reason, overrides] of Object.entries(REFUSALS)) {
    it(`refuses with ${reason}`, () => {
      const run = withAi(overrides);
      assert.equal(run.lobby.canKickAi(ROW), false);
      assert.equal(run.lobby.kickAi(ROW), false);
      assert.equal(run.state.armed(), undefined);
    });
  }
});

describe("lobbySettled", () => {
  it("waits for the restart's own modify_settings to be answered", () => {
    const run = active.build({ restartPending: true });
    assert.equal(run.lobby.lobbySettled(), false);

    run.restartContext({ pending_reapply: false });
    run.state.inFlight(1);
    assert.equal(run.lobby.lobbySettled(), false);

    run.state.inFlight(0);
    assert.equal(run.lobby.lobbySettled(), true);
  });
});
