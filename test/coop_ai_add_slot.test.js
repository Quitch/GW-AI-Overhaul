"use strict";

// gw_play/coop_ai.js, run as the scene runs it, for its canAddGwCampaignSlot
// wrapper alone: the host cannot add a slot while a battle launches, so no
// viewer can join a hire under way (issue #578).

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

// The scene as far as the bound wrappers read it, with the AI modules never
// loaded. A computed is its function, re-evaluated on every read.
function installScene() {
  const scene = {
    launching: makeObservable(false),
    stockCanAdd: makeObservable(true),
  };
  const game = {
    isTutorial: () => false,
    coopPlayerInventoryData: makeObservableArray([]),
  };
  const noop = () => {};
  stubs.setGlobal("model", {
    game: () => game,
    savedCoopPlayers: () => 1,
    gwCampaignRestartContext: () => undefined,
    gwCampaignActive: () => true,
    gwCampaignPerPlayerTechCards: () => false,
    isCampaignHost: () => true,
    gwoWhenBound: (bound) => {
      scene.bound = bound;
    },
    gwCampaignSlots: () => [],
    gwCampaignPlayerSetupBlocked: () => false,
    gwCampaignFightBlocked: () => false,
    gwCampaignFightTooltip: () => "",
    canAddGwCampaignSlot: scene.stockCanAdd,
    launchingFight: scene.launching,
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

describe("the co-op AI wrapper of canAddGwCampaignSlot", () => {
  it("lets the host add a slot while no battle launches", () => {
    installScene();

    assert.equal(model.canAddGwCampaignSlot(), true);
  });

  it("refuses a slot while a battle launches", () => {
    const scene = installScene();

    scene.launching(true);

    assert.equal(model.canAddGwCampaignSlot(), false);
  });

  it("refuses a slot whenever stock does", () => {
    const scene = installScene();

    scene.stockCanAdd(false);

    assert.equal(model.canAddGwCampaignSlot(), false);
  });
});
