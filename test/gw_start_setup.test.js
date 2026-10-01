"use strict";

// gw_start/setup.js, run as the scene runs it, with a stand-in for every
// module its requireGW callback asks for. The test holds Shared Systems for
// Galactic War's source list, each source's load and the galaxy build, so it
// can act while a war generates. jQuery is the sync fake: 2.1.4 runs a
// callback inside the resolve() that settles it, so settling a held step runs
// the rest of the chain there and then.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { MOD_ROOT, loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const { createFakeJQuery } = require("../scripts/lib/fake-jquery.js");
const {
  makeObservable,
  makeObservableArray,
} = require("../scripts/lib/fake-knockout.js");
const { runSceneScript } = require("../scripts/lib/scene-script.js");

const realModules = {
  "/shared/gwo_rng.js": loadCouiModule(MOD_ROOT + "/shared/gwo_rng.js"),
  "/shared/gwo_promise.js": loadCouiModule(MOD_ROOT + "/shared/gwo_promise.js"),
  "/gw_start/war_generation_failure.js": loadCouiModule(
    MOD_ROOT + "/gw_start/war_generation_failure.js"
  ),
  "/gw_start/war_generation.js": loadCouiModule(
    MOD_ROOT + "/gw_start/war_generation.js"
  ),
};

const stubs = createGlobalStubs();

afterEach(() => stubs.restoreGlobals());

const START_CARD = "gwc_start_test";
const GW_START = "coui://ui/main/game/galactic_war/gw_start/gw_start.html";
const GW_PLAY = "coui://ui/main/game/galactic_war/gw_play/gw_play.html";

const earthlike = {
  name: "Earthlike",
  planets: [{ generator: { biome: "earth" } }],
};
const unusable = {
  name: "Oasis",
  unusable: true,
  planets: [{ generator: { biome: "oasis" } }],
};

// What every api.* call returns: a then that chains, and nothing jQuery reads.
function engineResolved(value) {
  return {
    then: (onDone) => engineResolved(onDone ? onDone(value) : value),
  };
}

function makeWarGame(scene) {
  const star = { explored: makeObservable(false) };
  const galaxy = {
    stars: () => [star],
    origin: () => 0,
    build: (config) => {
      scene.builds.push(config);
      scene.build = scene.$.Deferred();
      return scene.build.promise();
    },
  };
  const inventory = {
    cards: makeObservableArray([]),
    setTag: () => {},
  };
  let current = 0;
  const game = {
    id: "war-" + (scene.games.length + 1),
    mode: makeObservable(),
    hardcore: makeObservable(),
    content: makeObservable(),
    coopPlayers: makeObservable(),
    coopPlayersSpecified: makeObservable(),
    lockCoopPlayers: makeObservable(),
    perPlayerTechCards: makeObservable(false),
    sharedByDefault: makeObservable(),
    name: makeObservable(),
    gameState: makeObservable(),
    inventory: () => inventory,
    galaxy: () => galaxy,
    move: (to) => {
      current = to;
    },
    currentStar: () => current,
    isTutorial: () => false,
  };
  scene.games.push(game);
  return game;
}

function makeModules(scene) {
  const $ = scene.$;
  const GW = {
    // Called with new, so not an arrow function.
    Game: function () {
      return makeWarGame(scene);
    },
    balance: { numberOfSystems: [18, 24, 36, 54, 78] },
    manifest: {
      saveGame: (game) => {
        scene.saved.push(game);
        return $.Deferred().resolve().promise();
      },
    },
  };
  GW.Game.gameStates = { active: "active" };

  const systemLoader = () => {
    throw new Error("setup.js made the system loader itself");
  };
  systemLoader.loadOptions = () => scene.loadOptions();

  return Object.assign(
    {
      "shared/gw_common": GW,
      "shared/gw_factions": [{}, {}, {}, {}, {}],
      "/gw_start/gwo_breeder.js": {
        populate: () => $.Deferred().resolve().promise(),
      },
      "/gw_start/gwo_teams.js": {
        getTeam: () => ({ remainingMinions: [], faction: { minions: [] } }),
      },
      "/gw_start/lore.js": { neutralSystems: [], aiSystems: [] },
      "/gw_start/ai_population.js": {
        brainForRace: (brains) => {
          scene.brainsAsked.push(brains);
          return brains.ai;
        },
        giveRace: () => {},
        populate: (war) => {
          scene.populated.push(war);
          return scene.outcome;
        },
      },
      "/gw_start/war_record.js": {
        build: (war) => {
          scene.records.push(war);
          return { seed: war.seed };
        },
      },
      "/shared/difficulty_levels.js": {
        difficulties: [{ difficultyName: "!LOC:Casual" }],
        tierSettings: [],
      },
      "/shared/ai.js": {
        quellerCompatibleMinions: (minions) => minions,
        originSystem: () => ({}),
      },
      "/shared/loadouts.js": {
        allCards: [{ id: START_CARD }],
        startCards: () => [],
      },
      // Never settles, so the start-card list is never rebuilt.
      "/shared/loadout_banks.js": { load: () => $.Deferred().promise() },
      "/gw_start/favourite_loadouts.js": {},
      "/shared/loadout_selection.js": {},
      "/gw_start/favourites.js": {},
      "/shared/version.js": "0.0.0-test",
      // Drops a system marked unusable, as the real one drops a system with
      // no army count or with a biome no battle can be given.
      "/gw_start/gw_system_brackets.js": {
        bracketsFrom: (systems) => {
          scene.pools.push(systems);
          const usable = systems.filter((system) => !system.unusable);
          return usable.length ? [{ min: 0, max: 32, systems: usable }] : [];
        },
      },
      "/faction/faction_seed.js": { reseed: () => {} },
      "main/game/galactic_war/shared/js/systems/template-loader": systemLoader,
      "/shared/gwo_biome_mods.js": {
        providers: () => $.Deferred().resolve({}).promise(),
      },
      "/gw_start/galaxy_build.js": { install: () => {} },
      "/shared/races.js": { MLA_ID: "mla", assign: () => ({}) },
    },
    realModules
  );
}

function makeModel() {
  const settings = {
    playerRace: makeObservable("mla"),
    difficultyLevel: makeObservable(0),
    factionScaling: makeObservable(false),
    largePlanets: makeObservable(false),
    simpleSystems: makeObservable(false),
    uniqueRaces: makeObservable(false),
    aiByRace: makeObservable({}),
    ai: makeObservable("Titans"),
    aiAlly: makeObservable("Titans"),
    aiCoop: makeObservable("Titans"),
    personalityTags: makeObservable([]),
    previousSettings: makeObservable(),
  };
  const startCard = {
    id: () => START_CARD,
    summary: () => "!LOC:Test loadout",
  };
  return {
    activeStartCard: makeObservable(startCard),
    startCards: makeObservableArray([startCard]),
    activeStartCardIndex: makeObservable(0),
    newGameName: makeObservable("New War"),
    gwoRaceInfo: makeObservable({
      races: [{ id: "mla" }],
      mods: [],
      addonMods: [],
    }),
    selectedNames: makeObservable(["Uber"]),
    newGameSeed: makeObservable("base-seed"),
    makeGameBusy: makeObservable(false),
    mode: makeObservable("gw"),
    newGameHardcore: makeObservable(false),
    normalizedNewGameCoopPlayers: makeObservable(1),
    newGameLockCoopPlayers: makeObservable(false),
    newGamePerPlayerTechCards: makeObservable(false),
    newGameSharedByDefault: makeObservable(false),
    gwoDifficultySettings: settings,
    newGameSizeIndex: makeObservable(2),
    playerFactionIndex: makeObservable(0),
    playerColor: makeObservable([]),
    updateCommander: () => {},
    devMode: makeObservable(false),
    // Stock's makeGame ran before any mod and left its own war here.
    newGame: makeObservable({ id: "stock-first-game" }),
    activeGameId: makeObservable(),
    lastSceneUrl: makeObservable(),
  };
}

function startScene() {
  const $ = Object.assign(
    () => ({ prepend: () => {}, val: () => [] }),
    createFakeJQuery({ sync: true })
  );
  const scene = {
    $: $,
    model: makeModel(),
    options: $.Deferred(),
    loadOptions: () => scene.options.promise(),
    sources: {},
    builds: [],
    pools: [],
    populated: [],
    brainsAsked: [],
    records: [],
    saved: [],
    games: [],
    outcome: { failed: false, spawnShortage: false, treasureStar: 0 },
    logged: [],
    errors: [],
    window: { location: { href: GW_START } },
  };
  scene.settings = scene.model.gwoDifficultySettings;
  const modules = makeModules(scene);
  const answer = (dep) => {
    if (dep === "cards/" + START_CARD) {
      return {};
    }
    const key = dep.startsWith(MOD_ROOT) ? dep.slice(MOD_ROOT.length) : dep;
    if (!(key in modules)) {
      throw new Error("no stand-in for " + dep);
    }
    return modules[key];
  };

  stubs.setGlobal("$", $);
  stubs.setGlobal("model", scene.model);
  stubs.setGlobal("ko", {
    observable: makeObservable,
    observableArray: makeObservableArray,
    computed: (fn) => fn,
    isObservable: (value) =>
      typeof value === "function" && typeof value.subscribe === "function",
  });
  stubs.setGlobal("api", {
    mods: {
      getMounted: () =>
        engineResolved([{ identifier: "com.wondible.pa.gw_shared_systems" }]),
    },
    content: { activeContent: () => "PAExpansion1" },
  });
  stubs.setGlobal("requireGW", (deps, callback) =>
    callback(...deps.map(answer))
  );
  stubs.setGlobal("window", scene.window);
  stubs.setGlobal("console", {
    log: (text) => scene.logged.push(text),
    warn: (text) => scene.logged.push(text),
    error: (text) => scene.errors.push(text),
  });

  runSceneScript(MOD_ROOT + "/gw_start/setup.js");

  assert.deepEqual(scene.errors, []);
  assert.equal(scene.model.ready(), true);
  return scene;
}

// Shared Systems' source list. A source's load is held until the test
// settles it, and a second load of it gets the same promise, as Shared
// Systems caches each source. A source named in `throwing` throws instead.
function listSources(scene, names, throwing = []) {
  scene.options.resolve(
    names.map((name) => ({
      name: name,
      load: () => {
        if (throwing.includes(name)) {
          throw new Error("no " + name);
        }
        scene.sources[name] = scene.sources[name] || scene.$.Deferred();
        return scene.sources[name].promise();
      },
    }))
  );
}

function finishBuild(scene) {
  scene.build.resolve(scene.games[scene.games.length - 1].galaxy());
}

describe("a war that generates", () => {
  it("is saved and opened", () => {
    const scene = startScene();

    scene.model.navToNewGame();
    listSources(scene, ["Uber"]);
    scene.sources.Uber.resolve([earthlike]);
    finishBuild(scene);

    assert.deepEqual(scene.saved, [scene.games[0]]);
    assert.equal(scene.window.location.href, GW_PLAY);
    assert.equal(scene.model.makeGameBusy(), false);
  });

  it("retries a spawn shortage from the derived seed", () => {
    const scene = startScene();
    scene.outcome = { failed: true, spawnShortage: true };

    scene.model.navToNewGame();
    listSources(scene, ["Uber"]);
    scene.sources.Uber.resolve([earthlike]);
    finishBuild(scene);

    assert.deepEqual(
      scene.builds.map((config) => config.seed),
      ["base-seed", "base-seed-1"]
    );
    assert.equal(scene.model.ready(), false);
  });

  // Shared Systems for Galactic War rerolls the seed whenever a source is
  // toggled, and nothing stops the player changing the rest.
  it("keeps the seed, galaxy size, and AI brains it started with", () => {
    const scene = startScene();

    scene.model.navToNewGame();
    scene.model.newGameSeed("rerolled");
    scene.model.newGameSizeIndex(4);
    scene.settings.ai("Queller");
    listSources(scene, ["Uber"]);
    scene.sources.Uber.resolve([earthlike]);
    finishBuild(scene);

    assert.equal(scene.builds[0].seed, "base-seed");
    assert.equal(scene.builds[0].size, 36);
    assert.equal(scene.records[0].seed, "base-seed");
    assert.equal(scene.records[0].galaxySize, "!LOC:Large");
    const brains = [scene.records[0].brains, scene.populated[0].brains]
      .concat(scene.brainsAsked)
      .map((asked) => asked.ai);
    assert.deepEqual(_.uniq(brains), ["Titans"]);
  });
});

describe("Go To War while a war generates", () => {
  it("stays disabled whatever Shared Systems' selection does", () => {
    const scene = startScene();

    scene.model.navToNewGame();
    assert.equal(scene.model.ready(), false);
    scene.model.selectedNames(["Uber", "My Systems"]);

    assert.equal(scene.model.ready(), false);
  });

  it("is freed by a failure only while a system source is chosen", () => {
    const scene = startScene();

    scene.model.navToNewGame();
    listSources(scene, ["Uber"]);
    scene.sources.Uber.resolve([earthlike]);
    scene.model.selectedNames([]);
    scene.build.reject("no usable star system");

    assert.notEqual(scene.model.gwoWarGenerationError(), "");
    assert.equal(scene.model.ready(), false);
    scene.model.selectedNames(["Uber"]);
    assert.equal(scene.model.ready(), true);
  });
});

describe("a war another run has taken over", () => {
  it("is neither recorded, saved, nor opened", () => {
    const scene = startScene();

    scene.model.navToNewGame();
    listSources(scene, ["Uber"]);
    scene.sources.Uber.resolve([earthlike]);
    scene.model.makeGameBusy({});
    finishBuild(scene);

    assert.deepEqual(scene.records, []);
    assert.deepEqual(scene.saved, []);
    assert.equal(scene.window.location.href, GW_START);
  });

  it("leaves its failure to the run that took over", () => {
    const scene = startScene();
    const owner = {};

    scene.model.navToNewGame();
    listSources(scene, ["Uber"]);
    scene.sources.Uber.resolve([earthlike]);
    scene.model.makeGameBusy(owner);
    scene.build.reject("no usable star system");

    assert.equal(scene.model.makeGameBusy(), owner);
    assert.equal(scene.model.gwoWarGenerationError(), "");
    assert.deepEqual(scene.errors, ["no usable star system"]);
  });
});

describe("Shared Systems' sources", () => {
  it("build brackets from the sources that load when another fails", () => {
    const scene = startScene();
    scene.model.selectedNames(["Uber", "Dead Server"]);

    scene.model.navToNewGame();
    listSources(scene, ["Uber", "Dead Server"]);
    scene.sources["Dead Server"].reject();
    scene.sources.Uber.resolve([earthlike]);

    assert.deepEqual(scene.pools, [[earthlike]]);
    assert.deepEqual(scene.builds[0].gwoSystemBrackets, [
      { min: 0, max: 32, systems: [earthlike] },
    ]);
    assert.deepEqual(scene.errors, [
      "System source failed to load: Dead Server",
    ]);
  });

  // The stars' fallback, Shared Systems' own loader, would ask for a failed
  // source again and wait for it for good, with Go To War disabled.
  const failedWithMessage = (scene) => {
    assert.deepEqual(scene.builds, []);
    assert.match(
      scene.model.gwoWarGenerationError(),
      /sources selected under Systems could not be loaded/
    );
    assert.equal(scene.model.makeGameBusy(), false);
    assert.equal(scene.model.ready(), true);
  };

  it("fail the war with a message when every selected source fails", () => {
    const scene = startScene();
    scene.model.selectedNames(["Dead Server", "Broken Pack"]);

    scene.model.navToNewGame();
    listSources(scene, ["Dead Server", "Broken Pack"], ["Broken Pack"]);
    scene.sources["Dead Server"].reject();

    failedWithMessage(scene);
  });

  it("fail the war with a message when their list fails to load", () => {
    const scene = startScene();

    scene.model.navToNewGame();
    scene.options.reject();

    failedWithMessage(scene);
  });

  it("fail the war with a message when loading their list throws", () => {
    const scene = startScene();
    scene.loadOptions = () => {
      throw new Error("no list");
    };

    scene.model.navToNewGame();

    failedWithMessage(scene);
  });

  it("fail the war with a message when one fails and the rest have no usable system", () => {
    const scene = startScene();
    scene.model.selectedNames(["Uber", "Dead Server"]);

    scene.model.navToNewGame();
    listSources(scene, ["Uber", "Dead Server"]);
    scene.sources["Dead Server"].reject();
    scene.sources.Uber.resolve([unusable]);

    failedWithMessage(scene);
  });

  it("leave the stars to Shared Systems' loader when every source loads but none has a usable system", () => {
    const scene = startScene();

    scene.model.navToNewGame();
    listSources(scene, ["Uber"]);
    scene.sources.Uber.resolve([unusable]);

    assert.equal(scene.builds.length, 1);
    assert.equal(scene.builds[0].gwoSystemBrackets, undefined);
  });
});
