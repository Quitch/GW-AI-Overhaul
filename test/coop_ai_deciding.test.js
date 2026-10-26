"use strict";

// gw_play/coop_ai.js, run as the scene runs it, for model.gwoCoopAiDeciding
// alone: the war waits while a co-op AI player owes a deal, or a prune
// before The Guardians. See coop.md, "Holding the war".

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { MOD_ROOT } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const {
  makeObservable,
  makeObservableArray,
} = require("../scripts/lib/fake-knockout.js");
const { runSceneScript } = require("../scripts/lib/scene-script.js");

const stubs = createGlobalStubs();

afterEach(() => stubs.restoreGlobals());

const AI = {
  playerId: "gwo_ai_1",
  inventory: { cards: [] },
  techCardDealCount: 2,
  gwaioAi: { serial: 1, name: "AI1" },
};

// The scene as far as the computed and the Fight button read it, with the
// AI modules never loaded. A computed is its function, re-evaluated on every
// read.
function installScene(options) {
  const scene = Object.assign(
    { perPlayer: true, host: true, hostDeals: 2, records: [AI] },
    options
  );
  const game = {
    isTutorial: () => false,
    coopPlayerInventoryData: makeObservableArray(scene.records),
    hostTechCardDealCount: () => scene.hostDeals,
  };
  const noop = () => {};
  stubs.setGlobal("model", {
    game: () => game,
    savedCoopPlayers: () => 1,
    gwCampaignRestartContext: () => undefined,
    gwCampaignActive: () => true,
    gwCampaignPerPlayerTechCards: () => scene.perPlayer,
    isCampaignHost: () => scene.host,
    getCoopPlayerTechCardDealCount: (record) => record.techCardDealCount,
    gwoWhenBound: (bound) => {
      scene.bound = bound;
    },
    gwCampaignSlots: () => [],
    gwCampaignPlayerSetupBlocked: () => false,
    gwCampaignFightBlocked: () => false,
    gwCampaignFightTooltip: () => "",
    canAddGwCampaignSlot: () => true,
    launchingFight: () => false,
    addGwCampaignSlot: noop,
    removeGwCampaignSlot: noop,
    pushCampaignLobbySettings: noop,
    fight: noop,
    restartFight: noop,
    send_message: noop,
  });
  stubs.setGlobal("ko", {
    observable: makeObservable,
    observableArray: makeObservableArray,
    computed: (fn) =>
      Object.assign(() => fn(), {
        subscribe: () => ({ dispose: noop }),
      }),
  });
  const element = {
    length: 1,
    find: () => element,
    filter: () => element,
    append: () => element,
    before: () => element,
    attr: () => element,
  };
  stubs.setGlobal("$", () => element);
  stubs.setGlobal("loadHtml", () => "");
  stubs.setGlobal("locTree", noop);
  stubs.setGlobal("CommanderUtility", { afterCommandersLoaded: noop });
  stubs.setGlobal("requireGW", noop);
  stubs.setGlobal("console", { log: noop, warn: noop, error: noop });

  runSceneScript(MOD_ROOT + "/gw_play/coop_ai.js");
  scene.bound();
  return scene;
}

const techOwing = (owes) => ({
  ready: () => true,
  owesPrune: (record) => owes(record),
});

describe("model.gwoCoopAiDeciding", () => {
  it("holds nothing while every AI is level and owes no prune", () => {
    installScene();
    model.gwoCoopAi.tech(techOwing(() => false));

    assert.equal(model.gwoCoopAiDeciding(), false);
    assert.equal(model.gwCampaignFightBlocked(), false);
  });

  it("holds the war while an AI owes a deal", () => {
    installScene({ hostDeals: 3 });

    assert.equal(model.gwoCoopAiDeciding(), true);
  });

  it("holds the war while an AI owes a prune, and blocks Fight", () => {
    installScene();
    const asked = [];
    model.gwoCoopAi.tech(
      techOwing((record) => {
        asked.push(record.playerId);
        return true;
      })
    );

    assert.equal(model.gwoCoopAiDeciding(), true);
    assert.deepEqual(asked, ["gwo_ai_1"]);
    assert.equal(model.gwCampaignFightBlocked(), true);
    assert.equal(model.gwCampaignFightTooltip(), "!LOC:Waiting for players");
  });

  it("holds nothing for a prune before the AI tech has loaded", () => {
    installScene();

    assert.equal(model.gwoCoopAiDeciding(), false);
  });

  it("holds nothing for a prune off the host or under shared tech", () => {
    installScene({ host: false });
    model.gwoCoopAi.tech(techOwing(() => true));
    assert.equal(model.gwoCoopAiDeciding(), false);

    stubs.restoreGlobals();
    installScene({ perPlayer: false });
    model.gwoCoopAi.tech(techOwing(() => true));
    assert.equal(model.gwoCoopAiDeciding(), false);
  });
});
