"use strict";

// gw_coop_per_player_loadout/gwo_loadouts.js, run as the scene runs it: which
// race the viewer's loadouts lock for, and when Join opens. See races.md.

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const {
  MOD_ROOT,
  loadCouiModule,
  registerModuleStub,
  requireShippedModule,
} = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const { createFakeJQuery } = require("../scripts/lib/fake-jquery.js");
const {
  makeObservable,
  makeObservableArray,
} = require("../scripts/lib/fake-knockout.js");
const { runSceneScript } = require("../scripts/lib/scene-script.js");

registerModuleStub("shared/gw_common", {
  manifest: {},
  bank: { hasStartCard: () => true },
});
const hostWar = requireShippedModule(
  MOD_ROOT + "/gw_coop_per_player_loadout/host_war.js"
);

const stubs = createGlobalStubs();

// A loadout card as the scene's makeKnown builds one, locked when the race in
// play is not MLA, as an MLA-only loadout is.
function card(id, locked) {
  return { id: () => id, gwoRaceLocked: locked };
}

let scene;

// Runs the scene script with the war and the banks held, so a test settles
// each when it chooses.
function runScene() {
  const $ = createFakeJQuery({ sync: true });
  const war = $.Deferred();
  const banks = $.Deferred();
  const built = [];
  const errors = [];
  const model = {
    ready: () => true,
    startCards: makeObservableArray([]),
    activeStartCardIndex: makeObservable(0),
    gwoViewerRace: makeObservable("mla"),
  };
  model.activeStartCard = Object.assign(
    () => model.startCards()[model.activeStartCardIndex()],
    { peek: () => model.startCards()[model.activeStartCardIndex()] }
  );

  stubs.setGlobal("$", $);
  stubs.setGlobal("ko", {
    observable: makeObservable,
    observableArray: makeObservableArray,
    computed: (fn) => fn,
  });
  stubs.setGlobal("model", model);
  stubs.setGlobal("console", { error: (text) => errors.push(text) });
  stubs.setGlobal("requireGW", (ids, onLoad) =>
    onLoad(
      {
        allCards: [],
        startCards: () => {
          const race = model.gwoViewerPlayerRace();
          built.push(race);
          return [
            card("gwc_start_vehicle", false),
            card("gwaio_start_paratrooper", race !== "mla"),
          ];
        },
      },
      {},
      { setupGwoDeck: () => {} },
      { load: () => banks.promise() },
      { load: () => war.promise(), playerRace: hostWar.playerRace },
      {
        selectableIndex: (cards, activeId, cardId, isLocked) =>
          cards.findIndex((each) => !isLocked(each)),
      },
      { build: (params) => $.Deferred().resolve(params).promise() }
    )
  );

  runSceneScript(MOD_ROOT + "/gw_coop_per_player_loadout/gwo_loadouts.js");
  return { model, war, banks, built, errors };
}

function selectParatrooper() {
  scene.model.activeStartCardIndex(1);
}

beforeEach(() => {
  scene = runScene();
});

afterEach(() => stubs.restoreGlobals());

describe("the race a viewer's loadouts lock for", () => {
  it("is the host's race without Separate races, though the picker holds MLA", () => {
    scene.banks.resolve();
    scene.war.resolve({ race: "legion", perPlayerRace: false });

    assert.equal(scene.model.gwoViewerRace(), "mla");
    assert.equal(scene.model.gwoViewerPlayerRace(), "legion");
    selectParatrooper();
    assert.equal(scene.model.ready(), false);
  });

  it("is the viewer's pick under Separate races", () => {
    scene.banks.resolve();
    scene.war.resolve({ race: "legion", perPlayerRace: true });

    scene.model.gwoViewerRace("mla");
    assert.equal(scene.model.gwoViewerPlayerRace(), "mla");
  });

  it("is MLA for a war that records no race", () => {
    scene.banks.resolve();
    scene.war.resolve({ race: undefined, perPlayerRace: false });

    assert.equal(scene.model.gwoViewerPlayerRace(), "mla");
  });

  it("is no race before the war has been read", () => {
    assert.equal(scene.model.gwoViewerPlayerRace(), undefined);
  });
});

describe("Join", () => {
  it("stays closed until both the banks and the war have resolved", () => {
    assert.equal(scene.model.ready(), false);

    scene.war.resolve({ race: "legion", perPlayerRace: false });
    assert.equal(scene.model.ready(), false);
    assert.deepEqual(scene.built, []);

    scene.banks.resolve();
    assert.deepEqual(scene.built, ["legion"]);
    assert.equal(scene.model.ready(), true);
  });

  it("opens whichever of the two resolves last", () => {
    scene.banks.resolve();
    assert.equal(scene.model.ready(), false);

    scene.war.resolve({ race: "legion", perPlayerRace: false });
    assert.deepEqual(scene.built, ["legion"]);
    assert.equal(scene.model.ready(), true);
  });

  it("stays closed, and lets a later consumer of the war run, when the build throws", () => {
    scene.banks.resolve();
    scene.model.gwoViewerRace = () => {
      throw new Error("build failed");
    };

    let joined = false;
    scene.war.resolve({ race: "legion", perPlayerRace: false });
    scene.war.promise().then(() => {
      joined = true;
    });

    assert.equal(joined, true);
    assert.equal(scene.model.ready(), false);
    assert.equal(scene.errors.length, 1);
    assert.match(scene.errors[0], /build failed/);
  });
});

describe("the starting inventory", () => {
  it("is stamped with the host's race without Separate races", () => {
    scene.war.resolve({ race: "legion", perPlayerRace: false, faction: 2 });

    let params;
    scene.model.buildStartingInventory("gwc_start_vehicle").then((value) => {
      params = value;
    });

    assert.equal(params.playerRace, "legion");
    assert.equal(params.playerFaction, 2);
  });

  it("carries no race for a war that records none", () => {
    scene.war.resolve({ race: undefined, perPlayerRace: false });

    let params;
    scene.model.buildStartingInventory("gwc_start_vehicle").then((value) => {
      params = value;
    });

    assert.equal(params.playerRace, undefined);
  });
});

describe("shared/loadouts.js in the co-op scene", () => {
  const known = (data) => ({ id: () => data.id, btnClass: () => "" });

  function loadLoadouts() {
    registerModuleStub(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
      {
        hasStartCard: () => true,
      }
    );
    registerModuleStub(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/loadout_banks.js",
      { hasStartCard: () => true }
    );
    stubs.setGlobal("model", {});
    return loadCouiModule(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/loadouts.js"
    );
  }

  function lockedIds(loadouts, viewerModel) {
    stubs.setGlobal(
      "model",
      Object.assign(
        { makeKnown: known, makeUnknown: known, gwoViewerRace: () => "mla" },
        viewerModel
      )
    );
    return loadouts
      .startCards()
      .filter((each) => each.gwoRaceLocked)
      .map((each) => each.id());
  }

  it("locks for the race the viewer plays, not the picker's value", () => {
    const loadouts = loadLoadouts();
    stubs.setGlobal("ko", { computed: (fn) => fn });

    const locked = lockedIds(loadouts, {
      gwoViewerPlayerRace: () => "legion",
    });

    assert.ok(locked.includes("gwaio_start_paratrooper"), locked.join());
    assert.deepEqual(
      lockedIds(loadouts, { gwoViewerPlayerRace: () => "mla" }),
      []
    );
  });
});
