"use strict";

// gw_play/coop_ai.js, run as the scene runs it: the race a new co-op AI player
// fields under per-player tech. Cluster's player side is MLA-only, even in a
// war saved with Separate races on. See races.md, "Cluster".

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { MOD_ROOT } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const { makeObservable } = require("../scripts/lib/fake-knockout.js");
const { runSceneScript } = require("../scripts/lib/scene-script.js");

const stubs = createGlobalStubs();

afterEach(() => stubs.restoreGlobals());

// The markup calls the scene script makes, each answering with the same
// chainable stand-in, as jQuery would.
function fakeDollar() {
  const element = { length: 1 };
  for (const name of ["find", "filter", "append", "before", "attr"]) {
    element[name] = () => element;
  }
  const $ = () => element;
  $.ajax = () => ({ then: () => {} });
  return $;
}

function installScene(playerFaction) {
  const scene = { built: [], installedAsked: 0, picked: [] };
  const inventory = {
    getTag: (context, name) =>
      ({ playerFaction: playerFaction, commander: "/host.json" })[name],
    minions: () => [],
  };
  const game = {
    isTutorial: () => false,
    inventory: () => inventory,
    coopPlayerInventoryData: () => [],
  };
  stubs.setGlobal("$", fakeDollar());
  stubs.setGlobal("ko", {
    observable: makeObservable,
    computed: (fn) => {
      const computed = () => fn();
      computed.subscribe = () => ({ dispose: () => {} });
      return computed;
    },
  });
  stubs.setGlobal("loadHtml", () => "");
  stubs.setGlobal("CommanderUtility", { afterCommandersLoaded: () => {} });
  stubs.setGlobal("model", {
    game: () => game,
    savedCoopPlayers: () => 1,
    gwCampaignRestartContext: () => undefined,
    gwCampaignPerPlayerTechCards: () => true,
    gwCampaignConnectedClients: () => [],
    displayName: () => "Host",
    gwoWhenBound: () => {},
  });
  stubs.setGlobal("requireGW", (ids, onLoad) =>
    onLoad(
      {
        takenNames: () => [],
        fieldedCommanders: () => [],
        buildAiRecord: (params) => {
          scene.built.push(params.race);
          return {};
        },
        pickAiRace: (offer) => {
          scene.picked.push(offer);
          return "legion";
        },
        withStartingTech: (record, start, race) => race,
      },
      (params) => {
        scene.createRecord = params.createRecord;
        return {};
      },
      {
        warRng: () => ({}),
        coopAiPlayerRng: () => ({ stream: () => ({}) }),
      },
      {
        CLUSTER_FACTION: 4,
        originSettings: () => ({ races: { perPlayerRace: true, mods: [] } }),
      },
      { raceOf: () => "mla", detect: () => [] },
      {},
      {},
      {},
      {},
      {},
      {
        installedRaces: () => {
          scene.installedAsked += 1;
          return {};
        },
      },
      { activeRaces: () => [{ id: "mla" }, { id: "legion" }] }
    )
  );

  runSceneScript(MOD_ROOT + "/gw_play/coop_ai.js");
  model.gwoCoopAi.tech({ startingTech: () => Promise.resolve({}) });
  return scene;
}

describe("a new co-op AI player's race under Separate races", () => {
  it("is the host's in a Cluster war, whatever the war recorded", async () => {
    const scene = installScene(4);

    assert.equal(await scene.createRecord({ serial: 1 }), "mla");
    assert.deepEqual(scene.built, ["mla"]);
    assert.equal(scene.installedAsked, 0);
    assert.deepEqual(scene.picked, []);
  });

  it("is drawn from the war's races for any other faction", async () => {
    const scene = installScene(0);

    assert.equal(await scene.createRecord({ serial: 1 }), "legion");
    assert.deepEqual(scene.built, ["legion"]);
    assert.deepEqual(scene.picked, [["mla", "legion"]]);
  });
});
