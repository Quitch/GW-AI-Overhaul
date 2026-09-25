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
      upsertThrows: false,
      createThrows: false,
      saveFails: false,
      saveThrows: false,
      applyThrows: false,
      snapshotThrows: false,
      noGwaio: false,
      // The seats the war was made with, and the humans due back from a
      // battle.
      warSeats: 3,
      expectedBack: 0,
    },
    overrides
  );

  const calls = {
    sent: [],
    applied: [],
    queued: [],
    snapshots: [],
    saves: 0,
    saveStars: [],
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
      if (options.applyThrows) {
        throw new Error("control not applied");
      }
      calls.applied.push(response);
      max(response.max_clients);
    },
    enqueueGwCampaignStateApply: (label, apply) => {
      calls.queued.push(label);
      return apply();
    },
    sendCampaignSnapshot: (reason, force) => {
      if (options.snapshotThrows) {
        throw new Error("snapshot failed");
      }
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
      // As a throwing subscriber of the records would, after the write.
      if (options.upsertThrows) {
        throw new Error("subscriber failed");
      }
      return true;
    },
  };

  const state = {
    ready: observable(options.ready),
    busy: observable(false),
    armed: observable(),
    inFlight: observable(0),
    expectedBack: observable(options.expectedBack),
  };

  const lobby = makeLobby({
    game: game,
    gwaio: () => (options.noGwaio ? undefined : gwaio),
    warSeats: () => options.warSeats,
    expectedBack: state.expectedBack,
    createRecord: (identity) => {
      if (options.createThrows) {
        throw new Error("no commander");
      }
      return aiRecord(identity.serial);
    },
    save: (withStars) => {
      calls.saves += 1;
      calls.saveStars.push(withStars);
      if (options.saveThrows) {
        throw new Error("database closed");
      }
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
    "a war without GWO's settings": { noGwaio: true },
    "the last battle's humans still reconnecting": { expectedBack: 2 },
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

  // An empty slot after a battle can be a viewer's who has not reconnected.
  it("offers a slot once the last battle's humans are back, or the wait is over", () => {
    const run = active.build({ expectedBack: 2 });
    assert.equal(run.lobby.canAddAi(), false);

    run.options.connected = [HOST, VIEWER];
    assert.equal(run.lobby.canAddAi(), true);

    run.options.connected = [HOST];
    run.state.expectedBack(0);
    assert.equal(run.lobby.canAddAi(), true);
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

  it("keeps the slot for an AI whose write a subscriber threw on", () => {
    const run = active.build({ upsertThrows: true });
    run.lobby.addAi();
    run.reply(true, { max_clients: 2 });

    assert.equal(run.records().length, 1);
    assert.equal(run.calls.sent.length, 1);
    assert.equal(run.state.busy(), false);
    assert.ok(
      run.calls.log.some((line) =>
        line.startsWith(
          "[GW COOP AI] added with an error: Error: subscriber failed"
        )
      ),
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

  // A seat the host opened with "+" past the war's own is the AI's alone, so
  // the next session still opens every seat the war was made with.
  it("marks an AI that fills a seat the host opened past the war's", () => {
    const run = active.build({ warSeats: 2 });
    run.lobby.addAi();
    run.reply(true, { max_clients: 2 });

    assert.equal(run.records()[0].gwaioAi.extraSeat, true);
  });

  it("leaves an AI in one of the war's own seats unmarked", () => {
    const run = active.build({ warSeats: 3 });
    run.lobby.addAi();
    run.reply(true, { max_clients: 2 });

    assert.equal("extraSeat" in run.records()[0].gwaioAi, false);
  });

  // An AI in a seat opened with "+" holds none of the war's, so the seat a
  // player left is still one of them.
  it("leaves unmarked an AI taking the seat a player left beside an AI in a seat opened past the war's", () => {
    const run = active.build({
      warSeats: 2,
      max: 2,
      control: { max_clients: 2 },
      records: [
        aiRecord(5, { gwaioAi: { serial: 5, name: "AI5", extraSeat: true } }),
      ],
    });
    run.lobby.addAi();
    run.reply(true, { max_clients: 1 });

    const added = run
      .records()
      .find((record) => record.playerId !== "gwo_ai_5");
    assert.ok(added, JSON.stringify(run.records()));
    assert.equal("extraSeat" in added.gwaioAi, false);
  });

  // The serial lives on the origin system; a kick changes records only.
  it("saves the stars with an add and not with a kick", () => {
    const run = active.build();
    run.lobby.addAi();
    run.reply(true, { max_clients: 2 });
    const row = { id: "gwo_ai_1", name: "AI1", gwoAi: true };
    run.lobby.kickAi(row);
    run.lobby.kickAi(row);

    assert.deepEqual(run.calls.saveStars, [true, false]);
  });

  it("keeps the AI and says so when the save throws", () => {
    const run = active.build({ saveThrows: true });
    run.lobby.addAi();
    run.reply(true, { max_clients: 2 });

    assert.equal(run.records().length, 1);
    assert.equal(run.state.busy(), false);
    assert.ok(
      run.calls.log.some((line) =>
        line.startsWith(
          "[GW COOP AI] war not saved after add: Error: database closed"
        )
      ),
      JSON.stringify(run.calls.log)
    );
  });

  it("keeps the AI and releases the lobby when the viewers cannot be told", () => {
    const run = active.build({
      connected: [HOST, VIEWER],
      snapshotThrows: true,
    });
    run.lobby.addAi();
    run.reply(true, { max_clients: 2 });

    assert.equal(run.records().length, 1);
    assert.equal(run.state.busy(), false);
    assert.ok(
      run.calls.log.some((line) =>
        line.startsWith(
          "[GW COOP AI] add not published: Error: snapshot failed"
        )
      ),
      JSON.stringify(run.calls.log)
    );
  });

  it("gives the slot back when the lobby control cannot be applied", () => {
    const run = active.build({ applyThrows: true });
    run.lobby.addAi();
    run.reply(true, { max_clients: 2 });

    assert.equal(run.records().length, 0);
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

  it("still returns the slot and clears busy when the save throws", () => {
    const run = withAi({ saveThrows: true });
    run.lobby.kickAi(ROW);
    run.lobby.kickAi(ROW);

    assert.equal(run.records().length, 1);
    assert.equal(run.calls.sent.length, 1);
    assert.equal(run.calls.sent[0].payload.max_clients, 3);
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
