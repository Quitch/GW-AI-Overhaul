"use strict";

// gw_start/war_generation.js: the steps of one war generation run, driven
// through start() with a stand-in for each module gw_start/setup.js hands it.
// jQuery is the sync fake, so a run with nothing held finishes inside start().
// The timing across the scene - a run taken over mid-step, sources settling
// while the player acts - is gw_start_setup.test.js's.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { MOD_ROOT, loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const { installFakeJQuery } = require("../scripts/lib/fake-jquery.js");
const {
  makeObservable,
  makeObservableArray,
} = require("../scripts/lib/fake-knockout.js");

const warGeneration = loadCouiModule(MOD_ROOT + "/gw_start/war_generation.js");
const gwoRng = loadCouiModule(MOD_ROOT + "/shared/gwo_rng.js");
const gwoPromise = loadCouiModule(MOD_ROOT + "/shared/gwo_promise.js");
const generationFailure = loadCouiModule(
  MOD_ROOT + "/gw_start/war_generation_failure.js"
);

const stubs = createGlobalStubs();

afterEach(() => stubs.restoreGlobals());

const GW_START = "coui://ui/main/game/galactic_war/gw_start/gw_start.html";
const GW_PLAY = "coui://ui/main/game/galactic_war/gw_play/gw_play.html";
const START_CARD = "gwc_start_test";

const DIFFICULTIES = [
  { difficultyName: "!LOC:Casual" },
  { difficultyName: "!LOC:Custom", customDifficulty: true },
];
const TIER_SETTINGS = [
  { name: "goForKill", key: "goForKill" },
  { name: "microType", key: "microType" },
  { name: "unableToExpandDelay", key: "unable_to_expand_delay" },
  { name: "econBase", key: "econBase" },
  { name: "personalityTags", key: "personality_tags" },
];

const usable = { name: "Usable", planets: [] };
const unusable = { name: "Unusable", unusable: true, planets: [] };

// What an engine call hands back: a then, and no promise() for jQuery to find.
function engineSettled(ok, value) {
  return {
    then: (onDone, onFail) => {
      const next = ok ? onDone : onFail;
      return engineSettled(true, next ? next(value) : value);
    },
  };
}

function makeGame(war) {
  const stars = [0, 1, 2, 3, 4, 5].map((index) => ({
    index: index,
    explored: makeObservable(false),
  }));
  const galaxy = {
    stars: () => stars,
    origin: () => 0,
    build: (config) => {
      war.builds.push(config);
      if (war.buildThrows) {
        throw war.buildThrows;
      }
      war.build = war.$.Deferred();
      if (!war.holdBuild) {
        war.build.resolve(galaxy);
      }
      return war.build.promise();
    },
  };
  const tags = {};
  const inventory = {
    cards: makeObservableArray([]),
    setTag: (context, name, value) => {
      tags[context + "." + name] = value;
    },
    save: () => ({ saved: "inventory" }),
  };
  let current;
  const game = {
    perPlayerTechCards: makeObservable(false),
    inventory: () => inventory,
    galaxy: () => galaxy,
    move: (to) => {
      current = to;
    },
    currentStar: () => current,
    isTutorial: () => false,
    upsertCoopPlayerInventoryData: (record) => war.upserts.push(record),
    tags: tags,
  };
  const settings = [
    "mode",
    "hardcore",
    "content",
    "coopPlayers",
    "coopPlayersSpecified",
    "lockCoopPlayers",
    "sharedByDefault",
    "name",
    "gameState",
  ];
  for (const setting of settings) {
    game[setting] = makeObservable();
  }
  war.games.push(game);
  return game;
}

// Spreads spreadPerTeam workers per team, then boosts each team's boss, as
// the breeder does, but on stars the test knows.
function breed(war, params) {
  war.breeds.push(params);
  const stars = params.galaxy.stars();
  params.teams.forEach((team, index) => {
    for (let n = 0; n < war.spreadPerTeam; n++) {
      params.spread(stars[1 + index], { team: index, spread: n });
    }
  });
  params.teams.forEach((team, index) => {
    if (!war.bossless.includes(index)) {
      params.boss(stars[1 + index], { team: index, boss: true });
    }
  });
  return war.$.when(params);
}

function makeModules(war) {
  const $ = war.$;
  const GW = {
    Game: function () {
      return makeGame(war);
    },
    balance: { numberOfSystems: [18, 24, 36, 54, 78] },
    manifest: {
      saveGame: (game) => {
        war.saved.push(game);
        return $.Deferred().resolve().promise();
      },
    },
  };
  GW.Game.gameStates = { active: "active" };

  const systemLoader = () => {
    throw new Error("war generation made the system loader itself");
  };
  systemLoader.loadOptions = () => war.loadOptions();

  return {
    GW: GW,
    GWFactions: [{}, {}, {}, {}, {}],
    gwoBreeder: { populate: (params) => breed(war, params) },
    gwoTeams: {
      getTeam: (faction) => war.teamFor(faction),
      makeBoss: (star, ai, team, sst, seed) => {
        war.bosses.push({ star, ai, team, sst, seed });
        return $.when(ai);
      },
    },
    gwoLore: {
      neutralSystems: ["n1", "n2", "n3", "n4", "n5", "n6", "n7", "n8"],
      aiSystems: ["a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8"],
    },
    gwoPopulation: {
      brainForRace: (brains, race, side) =>
        brains.aiByRace[race] ? brains.aiByRace[race][side] : brains.ai,
      giveRace: (rng, ai, race, keepCommander) => {
        war.raced.push({
          ai: ai,
          race: race,
          keepCommander: keepCommander,
          draw: rng.int(0, 1000000),
        });
      },
      populate: (populated, teamInfo) => {
        war.populated.push({ war: populated, teamInfo: teamInfo });
        war.onPopulate();
        return war.outcome;
      },
    },
    gwoWarRecord: {
      build: (record) => {
        war.records.push(record);
        war.onRecord();
        return { seed: record.seed };
      },
    },
    gwoDifficulty: { difficulties: DIFFICULTIES, tierSettings: TIER_SETTINGS },
    gwoAI: {
      quellerCompatibleMinions: (minions) =>
        minions.filter((minion) => !minion.titansOnly),
      originSystem: () => war.originSystem,
    },
    gwoVersion: "9.9.9",
    gwoSystemBrackets: {
      bracketsFrom: (systems, providers) => {
        war.pools.push({ systems, providers });
        const kept = systems.filter((system) => !system.unusable);
        return kept.length ? [{ min: 0, max: 32, systems: kept }] : [];
      },
    },
    gwoRng: gwoRng,
    gwoFactionSeed: {
      reseed: (factions, rng) => war.reseeds.push(rng.int(0, 1000000)),
    },
    chooseStarSystemTemplates: systemLoader,
    gwoBiomeMods: {
      providers: () => $.Deferred().resolve({ lava: "provider" }).promise(),
    },
    gwoRaces: {
      MLA_ID: "mla",
      assign: (rng, factions, pool, options) => {
        war.assigned.push({ factions: factions.slice(), pool, options });
        return war.raceByFaction;
      },
    },
    gwoPromise: gwoPromise,
    generationFailure: generationFailure,
  };
}

function makeModel(war) {
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
    aiCoop: makeObservable(),
    // Custom's settings, as its selects write them back.
    goForKill: makeObservable("true"),
    microType: makeObservable("2"),
    unableToExpandDelay: makeObservable(""),
    econBase: makeObservable(0.5),
    personalityTags: makeObservableArray(["Default"]),
  };
  return {
    gwoDifficultySettings: settings,
    activeStartCard: makeObservable({
      id: () => START_CARD,
      summary: () => "!LOC:Test loadout",
    }),
    newGameName: makeObservable("New War"),
    gwoRaceInfo: makeObservable({
      races: [{ id: "mla" }],
      mods: ["race mods"],
      addonMods: [],
    }),
    newGameSeed: makeObservable("base-seed"),
    makeGameBusy: makeObservable(false),
    mode: makeObservable("gw"),
    newGameHardcore: makeObservable(true),
    normalizedNewGameCoopPlayers: makeObservable(1),
    newGameLockCoopPlayers: makeObservable(false),
    newGamePerPlayerTechCards: makeObservable(false),
    newGameSharedByDefault: makeObservable(true),
    newGameSizeIndex: makeObservable(1),
    playerFactionIndex: makeObservable(0),
    playerColor: makeObservable([
      [1, 2, 3],
      [4, 5, 6],
    ]),
    updateCommander: () => {
      war.commanderUpdates.push(war.model.newGame());
    },
    devMode: makeObservable(false),
    newGame: makeObservable({ id: "stock-first-game" }),
    activeGameId: makeObservable(),
    lastSceneUrl: makeObservable(),
    uberId: makeObservable("uber-1"),
    selectedCommander: makeObservable("/pa/units/commanders/tank/tank.json"),
    gwoWarGenerationError: makeObservable(""),
    selectedNames: makeObservable(["Uber"]),
  };
}

// A card that deals params, as a loadout with choices does.
function dealingCard(war) {
  return {
    getContext: (galaxy, inventory) => {
      war.dealt.push("context");
      return { galaxy: galaxy, inventory: inventory };
    },
    deal: (star, context) => {
      war.dealt.push("deal");
      return { params: { chosen: "tank", star: star.index }, context };
    },
    keep: (deal, context) => war.dealt.push(["keep", deal, context]),
    releaseContext: (context) => war.dealt.push(["release", context]),
  };
}

function makeWar() {
  const war = {
    $: installFakeJQuery(stubs, { sync: true }),
    builds: [],
    breeds: [],
    bosses: [],
    raced: [],
    populated: [],
    records: [],
    saved: [],
    upserts: [],
    games: [],
    pools: [],
    reseeds: [],
    assigned: [],
    dealt: [],
    logged: [],
    errors: [],
    pickedTags: [],
    settingsSaved: 0,
    commanderUpdates: [],
    spreadPerTeam: 0,
    bossless: [],
    holdBuild: false,
    raceByFaction: {},
    outcome: { failed: false, spawnShortage: false, treasureStar: 3 },
    originSystem: {},
    sharedSystems: false,
    sources: {},
    onPopulate: () => {},
    onRecord: () => {},
    teamFor: (faction) => ({
      remainingMinions: [{ name: "minion " + faction }],
      faction: { minions: [{ name: "minion " + faction }] },
    }),
    window: { location: { href: GW_START } },
  };
  // Stamped with its id, as setup.js stamps each loaded card.
  war.cards = { [START_CARD]: { id: START_CARD, ...dealingCard(war) } };
  war.loadOptions = () => war.$.Deferred().resolve(war.options).promise();
  war.options = [
    { name: "Uber", load: () => war.$.Deferred().resolve([usable]).promise() },
  ];
  war.modules = makeModules(war);
  war.model = makeModel(war);
  war.generatingWar = makeObservable(false);

  stubs.setGlobal("model", war.model);
  stubs.setGlobal("window", war.window);
  stubs.setGlobal("api", { content: { activeContent: () => "PAExpansion1" } });
  stubs.setGlobal("ko", {
    observable: (value) => {
      const observable = makeObservable(value);
      observable.extend = (extension) => {
        if (extension.session === "displayName") {
          observable("Session Name");
        }
        return observable;
      };
      return observable;
    },
  });
  stubs.setGlobal("console", {
    log: (text) => war.logged.push(text),
    warn: (text) => war.logged.push(text),
    error: (text) => war.errors.push(String(text)),
  });

  war.mounted = engineSettled(true, []);
  const loaded = war.$.Deferred().resolve();
  war.generation = warGeneration(war.modules, {
    generatingWar: war.generatingWar,
    sharedSystemsActive: () => war.sharedSystems,
    modsMounted: {
      then: (onDone, onFail) => war.mounted.then(onDone, onFail),
    },
    defaultNewGameName: "New War",
    startCardsLoaded: loaded,
    processedStartCards: war.cards,
    syncPickedTags: () => war.pickedTags.push(war.model.makeGameBusy()),
    saveDifficultySettings: () => {
      war.settingsSaved++;
    },
  });
  // The retry goes through the scene's Go To War, as it does in game.
  war.model.navToNewGame = () => war.generation.start();
  war.start = () => war.generation.start();
  war.game = () => war.games[war.games.length - 1];
  return war;
}

describe("a war that generates", () => {
  it("is built, dealt its loadout, peopled, recorded, saved, and opened", () => {
    const war = makeWar();

    war.start();

    const game = war.game();
    assert.equal(war.builds.length, 1);
    assert.equal(game.inventory().cards()[0].id, START_CARD);
    assert.equal(game.currentStar(), 0);
    assert.equal(game.galaxy().stars()[0].explored(), true);
    assert.equal(game.gameState(), "active");
    assert.equal(war.populated.length, 1);
    assert.deepEqual(war.originSystem.gwaio, { seed: "base-seed" });
    assert.equal(war.model.newGame(), game);
    assert.deepEqual(war.saved, [game]);
    assert.equal(war.model.activeGameId(), game.id);
    assert.equal(war.model.lastSceneUrl(), GW_START);
    assert.equal(war.window.location.href, GW_PLAY);
    assert.equal(war.model.makeGameBusy(), false);
    assert.equal(war.settingsSaved, 1);
    assert.deepEqual(war.logged, [
      "War created successfully using Galactic War Overhaul v9.9.9",
    ]);
    assert.deepEqual(war.errors, []);
  });

  // Go To War stays disabled: success leaves the scene.
  it("keeps Go To War disabled once the war opens", () => {
    const war = makeWar();

    war.start();

    assert.equal(war.generatingWar(), true);
  });

  it("builds the galaxy from the scene's settings", () => {
    const war = makeWar();
    war.model.gwoDifficultySettings.simpleSystems(true);
    war.model.gwoDifficultySettings.largePlanets(true);
    war.model.normalizedNewGameCoopPlayers(2);

    war.start();

    const config = war.builds[0];
    assert.equal(config.seed, "base-seed");
    assert.equal(config.size, 24);
    assert.equal(config.useEasierSystemTemplate, true);
    assert.equal(config.largePlanets, true);
    assert.equal(config.content, "PAExpansion1");
    assert.equal(config.coopPlayersForSystemGeneration, 2);
    assert.equal(config.minStarDistance, 2);
    assert.equal(config.maxStarDistance, 4);
    assert.equal(config.maxConnections, 4);
    assert.equal(
      config.gwoRng(),
      gwoRng.create("base-seed").stream("galaxy")()
    );
  });

  it("sets the game up from the scene", () => {
    const war = makeWar();
    war.model.newGameLockCoopPlayers(true);

    war.start();

    const game = war.game();
    assert.equal(game.mode(), "gw");
    assert.equal(game.hardcore(), true);
    assert.equal(game.content(), "PAExpansion1");
    assert.equal(game.coopPlayers(), 1);
    assert.equal(game.coopPlayersSpecified(), true);
    assert.equal(game.lockCoopPlayers(), true);
    assert.equal(game.sharedByDefault(), true);
    assert.deepEqual(game.tags, {
      "global.playerFaction": 0,
      "global.playerColor": [
        [1, 2, 3],
        [4, 5, 6],
      ],
      "global.playerRace": "mla",
    });
    // Once, and on the war's own game rather than stock's first one.
    assert.equal(war.commanderUpdates.length, 1);
    assert.equal(war.commanderUpdates[0], game);
  });

  it("records the war for the play scene", () => {
    const war = makeWar();
    war.model.devMode(true);
    war.model.gwoUniqueAiLoadouts = makeObservable(true);

    war.start();

    const record = war.records[0];
    assert.equal(record.seed, "base-seed");
    assert.equal(record.tier, DIFFICULTIES[0]);
    assert.equal(record.tierData, DIFFICULTIES[0]);
    assert.equal(record.galaxySize, "!LOC:Medium");
    assert.equal(record.settings, war.model.gwoDifficultySettings);
    assert.equal(record.devMode, true);
    assert.deepEqual(record.brains, {
      aiByRace: {},
      ai: "Titans",
      aiAlly: "Titans",
      aiCoop: undefined,
    });
    assert.deepEqual(record.installedRaces, ["mla"]);
    assert.equal(record.treasureStar, 3);
    assert.equal(record.playerCount, 1);
    assert.equal(record.playerRace, "mla");
    assert.equal(record.raceByFaction, war.raceByFaction);
    assert.equal(record.raceInfo, war.model.gwoRaceInfo());
    assert.equal(record.perPlayerTechCards, false);
    assert.equal(record.uniqueAiLoadouts, true);
    assert.equal(record.galaxy, war.game().galaxy());
  });

  it("records no unique AI loadouts where the co-op AI option is absent", () => {
    const war = makeWar();

    war.start();

    assert.equal(war.records[0].uniqueAiLoadouts, false);
  });
});

describe("the war's name", () => {
  it("is made from the difficulty, players, size, and loadout while it is the default", () => {
    const war = makeWar();

    war.start();

    const name =
      "!LOC:Casual - 1 !LOC:Players - !LOC:Medium - !LOC:Test loadout";
    assert.equal(war.model.newGameName(), name);
    assert.equal(war.game().name(), name);
  });

  it("gives a size past the known ones as Unknown", () => {
    const war = makeWar();
    war.model.newGameSizeIndex(9);

    war.start();

    assert.match(war.model.newGameName(), /!LOC:Unknown/);
    assert.equal(war.records[0].galaxySize, "!LOC:Unknown");
    assert.equal(war.builds[0].size, 40);
  });

  it("is the player's own when they named the war", () => {
    const war = makeWar();
    war.model.newGameName("My War");

    war.start();

    assert.equal(war.model.newGameName(), "My War");
    assert.equal(war.game().name(), "My War");
  });
});

describe("the player's race", () => {
  it("is the chosen race when it is installed", () => {
    const war = makeWar();
    war.model.gwoRaceInfo({
      races: [{ id: "mla" }, { id: "legion" }],
      mods: [],
      addonMods: [],
    });
    war.model.gwoDifficultySettings.playerRace("legion");

    war.start();

    assert.equal(war.game().tags["global.playerRace"], "legion");
    assert.deepEqual(war.assigned[0].pool, ["mla", "legion"]);
    assert.deepEqual(war.assigned[0].options, {
      unique: false,
      taken: ["legion"],
    });
    assert.equal(war.records[0].playerRace, "legion");
  });

  it("is MLA when the chosen race is not installed", () => {
    const war = makeWar();
    war.model.gwoDifficultySettings.playerRace("legion");
    war.model.gwoDifficultySettings.uniqueRaces(true);

    war.start();

    assert.equal(war.game().tags["global.playerRace"], "mla");
    assert.deepEqual(war.assigned[0].options, {
      unique: true,
      taken: ["mla"],
    });
  });
});

describe("the enemy factions", () => {
  it("are every faction but the player's, shuffled by the teams stream", () => {
    const war = makeWar();
    war.model.playerFactionIndex(2);

    war.start();

    const expected = gwoRng
      .create("base-seed")
      .stream("teams")
      .shuffle([0, 1, 3, 4]);
    assert.deepEqual(war.assigned[0].factions, expected);
    assert.deepEqual(war.populated[0].war.aiFactions, expected);
  });

  it("are one per galaxy size step under Faction Scaling", () => {
    const war = makeWar();
    war.model.gwoDifficultySettings.factionScaling(true);

    war.start();

    const teams = gwoRng.create("base-seed").stream("teams");
    const expected = teams.shuffle(teams.sample([1, 2, 3, 4], 2));
    assert.deepEqual(war.assigned[0].factions, expected);
  });
});

describe("the difficulty tier", () => {
  it("is the named tier itself", () => {
    const war = makeWar();

    war.start();

    assert.equal(war.populated[0].war.tier, DIFFICULTIES[0]);
    assert.deepEqual(war.pickedTags, []);
  });

  // A numeric select reads back as a string; the string booleans stay strings.
  it("is Custom's settings in a tier's shape, read after the picker syncs", () => {
    const war = makeWar();
    war.model.gwoDifficultySettings.difficultyLevel(1);

    war.start();

    const snapshot = {
      goForKill: "true",
      microType: 2,
      unable_to_expand_delay: "",
      econBase: 0.5,
      personality_tags: ["Default"],
    };
    assert.deepEqual(war.populated[0].war.tier, snapshot);
    assert.equal(war.records[0].tier, DIFFICULTIES[1]);
    assert.deepEqual(war.records[0].tierData, snapshot);
    assert.equal(war.pickedTags.length, 1);
  });
});

describe("per-player tech", () => {
  it("shares no card by default and stores the host's own record", () => {
    const war = makeWar();
    war.model.newGamePerPlayerTechCards(true);

    war.start();

    const game = war.game();
    assert.equal(game.perPlayerTechCards(), true);
    assert.equal(game.sharedByDefault(), false);
    assert.equal(war.upserts.length, 1);
    const record = war.upserts[0];
    assert.equal(record.playerId, "uber-1");
    assert.equal(record.playerName, "Session Name");
    assert.equal(record.commander, "/pa/units/commanders/tank/tank.json");
    assert.equal(record.loadoutCardId, START_CARD);
    assert.deepEqual(record.inventory, { saved: "inventory" });
    assert.equal(record.techCardDealCount, 0);
    assert.equal(typeof record.updatedAt, "number");
    assert.equal(war.records[0].perPlayerTechCards, true);
  });

  it("stores no record without it", () => {
    const war = makeWar();

    war.start();

    assert.deepEqual(war.upserts, []);
  });
});

describe("the loadout", () => {
  it("is dealt at the origin, and a deal's params join the card", () => {
    const war = makeWar();

    war.start();

    const card = war.game().inventory().cards()[0];
    assert.deepEqual(card, { id: START_CARD, chosen: "tank", star: 0 });
    const context = {
      galaxy: war.game().galaxy(),
      inventory: war.game().inventory(),
    };
    assert.deepEqual(war.dealt, [
      "context",
      "deal",
      ["keep", { params: { chosen: "tank", star: 0 }, context }, context],
      ["release", context],
    ]);
  });

  it("is only its id for a card that deals nothing", () => {
    const war = makeWar();
    war.cards[START_CARD] = {
      id: START_CARD,
      deal: () => ({ params: "not an object" }),
    };

    war.start();

    assert.deepEqual(war.game().inventory().cards(), [{ id: START_CARD }]);
    assert.equal(war.saved.length, 1);
  });

  it("fails the war as a bug when its card never loaded", () => {
    const war = makeWar();
    delete war.cards[START_CARD];

    war.start();

    assert.deepEqual(war.errors.slice(0, 2), [
      "No matching start card ID found",
      "no matching start card ID: " + START_CARD,
    ]);
    assert.deepEqual(war.breeds, []);
    assert.match(war.model.gwoWarGenerationError(), /because of a bug/);
    assert.equal(war.generatingWar(), false);
  });

  it("fails the war as a bug when its card throws", () => {
    const war = makeWar();
    war.cards[START_CARD] = {
      id: START_CARD,
      deal: () => {
        throw new Error("no deal");
      },
    };

    war.start();

    assert.match(
      war.errors[0],
      /^Start card threw while being dealt: gwc_start_test: Error: no deal/
    );
    assert.equal(war.errors[1], "start card threw: " + START_CARD);
    assert.deepEqual(war.breeds, []);
    assert.match(war.model.gwoWarGenerationError(), /because of a bug/);
  });

  for (const id of ["nem_start_deepspace", "gwaio_start_tourist"]) {
    it(`${id} tells the population that allies break`, () => {
      const war = makeWar();
      war.model.activeStartCard({ id: () => id, summary: () => "" });
      war.cards[id] = { id: id };

      war.start();

      assert.equal(war.populated[0].war.startCardBreaksAllies, true);
    });
  }

  it("breaks allies when a mod lists it", () => {
    const war = makeWar();
    war.model.gwoStarCardsWhichBreakAllies = [START_CARD];

    war.start();

    assert.equal(war.populated[0].war.startCardBreaksAllies, true);
  });

  it("leaves allies alone otherwise", () => {
    const war = makeWar();

    war.start();

    assert.equal(war.populated[0].war.startCardBreaksAllies, false);
  });
});

describe("the AI teams", () => {
  const quellerPool = () => [
    { name: "either" },
    { name: "titans only", titansOnly: true },
  ];

  it("lose Queller-incompatible minions where their race runs Queller", () => {
    const war = makeWar();
    war.raceByFaction = { 1: "bugs", 2: "mla", 3: "mla", 4: "mla" };
    war.model.gwoDifficultySettings.aiByRace({ bugs: { enemy: "Queller" } });
    war.teamFor = () => ({
      remainingMinions: quellerPool(),
      faction: { minions: quellerPool(), name: "faction" },
    });

    war.start();

    const teams = war.breeds[0].teams;
    const factions = war.assigned[0].factions;
    teams.forEach((team, index) => {
      const names = team.remainingMinions.map((minion) => minion.name);
      const queller = factions[index] === 1;
      assert.deepEqual(names, queller ? ["either"] : ["either", "titans only"]);
      assert.equal(team.faction.minions.length, queller ? 1 : 2);
      assert.equal(team.faction.name, "faction");
    });
  });

  it("take their workers from the team's own list, which each pick leaves", () => {
    const war = makeWar();
    war.spreadPerTeam = 2;
    const listed = [];
    war.teamFor = (faction) => {
      const workers = [
        { name: "worker a", personality_tags: ["a"] },
        { name: "worker b", personality_tags: ["b"] },
      ];
      listed.push(...workers);
      return { workers: workers, faction: { minions: [], faction: faction } };
    };

    war.start();

    const teamInfo = war.populated[0].teamInfo;
    teamInfo.forEach((info, index) => {
      const names = info.workers.map((worker) => worker.ai.name).sort();
      assert.deepEqual(names, ["worker a", "worker b"]);
      assert.equal(info.faction, war.assigned[0].factions[index]);
      assert.deepEqual(war.breeds[0].teams[index].workers, []);
      for (const worker of info.workers) {
        assert.equal(worker.ai.faction, info.faction);
        assert.equal(worker.star, war.game().galaxy().stars()[1 + index]);
        // A copy, so the tags are the AI's own rather than the team's.
        assert.ok(
          !listed.some((w) => w.personality_tags === worker.ai.personality_tags)
        );
      }
    });
  });

  it("take their workers from the remaining minions, then from the faction's", () => {
    const war = makeWar();
    war.spreadPerTeam = 3;
    war.teamFor = () => ({
      remainingMinions: [{ name: "minion a" }, { name: "minion b" }],
      faction: { minions: [{ name: "faction minion" }] },
    });

    war.start();

    const workers = war.populated[0].teamInfo[0].workers.map(
      (worker) => worker.ai.name
    );
    assert.deepEqual(workers.slice(0, 2).sort(), ["minion a", "minion b"]);
    assert.equal(workers[2], "faction minion");
    assert.deepEqual(war.breeds[0].teams[0].remainingMinions, []);
  });

  it("keep a worker as the breeder made it when the team has no pool", () => {
    const war = makeWar();
    war.spreadPerTeam = 1;
    war.teamFor = () => ({ faction: {} });

    war.start();

    const ai = war.populated[0].teamInfo[0].workers[0].ai;
    assert.deepEqual(Object.keys(ai).sort(), ["faction", "spread", "team"]);
  });

  it("give each worker its race from a stream keyed by faction and spawn order", () => {
    const war = makeWar();
    war.spreadPerTeam = 2;
    war.raceByFaction = { 1: "legion", 2: "mla", 3: "bugs", 4: "mla" };

    war.start();

    const root = gwoRng.create("base-seed");
    const workers = war.raced.filter((entry) => !entry.keepCommander);
    assert.equal(workers.length, 8);
    for (const entry of workers) {
      const info = war.populated[0].teamInfo[entry.ai.team];
      const order = info.workers.findIndex((worker) => worker.ai === entry.ai);
      const expected = root
        .stream("race", info.faction)
        .stream("worker", order)
        .int(0, 1000000);
      assert.equal(entry.draw, expected);
      assert.equal(entry.race, war.raceByFaction[info.faction]);
    }
  });

  it("make each boss with a seed keyed by team, and keep its commander", () => {
    const war = makeWar();

    war.start();

    const root = gwoRng.create("base-seed");
    assert.equal(war.bosses.length, 4);
    war.bosses.forEach((made, team) => {
      assert.equal(made.ai.team, team);
      assert.equal(made.team, war.breeds[0].teams[team]);
      assert.equal(made.sst, undefined);
      assert.equal(made.seed, root.stream("boss", team).int(0, 2147483647));
      const info = war.populated[0].teamInfo[team];
      assert.equal(info.boss, made.ai);
      assert.equal(made.ai.faction, info.faction);
    });
    const bosses = war.raced.filter((entry) => entry.keepCommander);
    assert.equal(bosses.length, 4);
    for (const entry of bosses) {
      assert.equal(
        entry.draw,
        root.stream("race", entry.ai.faction).int(0, 1000000)
      );
    }
  });

  it("are spread by the breeder with GWO's placement settings", () => {
    const war = makeWar();

    war.start();

    const params = war.breeds[0];
    assert.equal(params.galaxy, war.game().galaxy());
    assert.equal(params.neutralStars, 4);
    assert.equal(params.orderedSpawn, false);
    assert.equal(params.breedToOrigin, false);
    assert.equal(params.canSpread(), true);
    assert.equal(params.spawn(), undefined);
    assert.equal(params.rng(), gwoRng.create("base-seed").stream("breeder")());
  });

  it("are peopled with the war's lore, brains, and seed", () => {
    const war = makeWar();
    war.model.gwoDifficultySettings.ai("Queller");

    war.start();

    const populated = war.populated[0].war;
    const lore = gwoRng.create("base-seed").stream("lore");
    assert.deepEqual(populated.lore, {
      neutral: lore.shuffle(war.modules.gwoLore.neutralSystems),
      ai: lore.shuffle(war.modules.gwoLore.aiSystems),
    });
    assert.equal(populated.brains.ai, "Queller");
    assert.equal(populated.playerFaction, 0);
    assert.equal(populated.playerCount, 1);
    assert.equal(populated.factions, war.modules.GWFactions);
    assert.equal(populated.sharedSystems, false);
    assert.equal(populated.rng(), gwoRng.create("base-seed")());
  });
});

describe("the factions' data", () => {
  it("is reseeded from the war's factions stream", () => {
    const war = makeWar();

    war.start();

    assert.deepEqual(war.reseeds, [
      gwoRng.create("base-seed").stream("factions").int(0, 1000000),
    ]);
  });
});

describe("a war with too few home systems", () => {
  it("is retried from seeds derived from the one entered, then abandoned", () => {
    const war = makeWar();
    war.outcome = { failed: true, spawnShortage: true };

    war.start();

    assert.deepEqual(
      war.builds.map((config) => config.seed),
      ["base-seed", "base-seed-1", "base-seed-2", "base-seed-3", "base-seed-4"]
    );
    assert.deepEqual(war.saved, []);
    assert.match(war.model.gwoWarGenerationError(), /too small/);
    assert.equal(war.model.newGameSeed(), "base-seed");
    assert.equal(war.generatingWar(), false);
    assert.equal(war.model.makeGameBusy(), false);
    assert.equal(
      war.errors[war.errors.length - 1],
      "Failed to generate valid war: spawnShortage"
    );
  });

  // The count and the seed belong to one war, whichever way it ended.
  const retriedOnce = (war) => {
    war.model.newGameSeed("second");
    war.outcome = { failed: true, spawnShortage: true };
    // The first attempt's outcome is already returned when the second asks.
    war.onPopulate = () => {
      war.onPopulate = () => {
        war.outcome = { failed: false, spawnShortage: false };
      };
    };
    const before = war.builds.length;

    war.start();

    assert.deepEqual(
      war.builds.slice(before).map((config) => config.seed),
      ["second", "second-1"]
    );
    assert.equal(war.records[war.records.length - 1].seed, "second-1");
  };

  it("is retried afresh from the seed entered for the next war", () => {
    const war = makeWar();
    war.outcome = { failed: true, spawnShortage: true };
    war.start();

    retriedOnce(war);

    assert.equal(war.model.gwoWarGenerationError(), "");
  });

  it("is retried afresh after a war that opened", () => {
    const war = makeWar();
    war.start();

    retriedOnce(war);
  });

  it("records the seed of the attempt that worked", () => {
    const war = makeWar();
    war.outcome = { failed: true, spawnShortage: true };
    war.onRecord = () => {};
    let attempts = 0;
    war.onPopulate = () => {
      attempts++;
      if (attempts === 3) {
        war.outcome = { failed: false, spawnShortage: false };
      }
    };

    war.start();

    assert.equal(war.records.length, 1);
    assert.equal(war.records[0].seed, "base-seed-2");
    assert.equal(war.model.newGameSeed(), "base-seed-2");
    assert.equal(war.saved.length, 1);
  });
});

describe("a war whose AIs could not be peopled", () => {
  it("is not retried, and is reported as a bug with the seed entered", () => {
    const war = makeWar();
    war.outcome = { failed: true, spawnShortage: false };

    war.start();

    assert.equal(war.builds.length, 1);
    assert.deepEqual(war.records, []);
    assert.match(war.model.gwoWarGenerationError(), /because of a bug/);
    assert.deepEqual(war.errors, ["Failed to generate valid war: error"]);
  });
});

describe("a war whose step throws", () => {
  it("is not retried, and is reported as a bug with the seed entered", () => {
    const war = makeWar();
    war.modules.gwoWarRecord.build = () => {
      throw new Error("no record");
    };

    war.start();

    assert.equal(war.builds.length, 1);
    assert.match(war.model.gwoWarGenerationError(), /because of a bug/);
    assert.equal(war.model.newGameSeed(), "base-seed");
    assert.equal(war.generatingWar(), false);
    assert.equal(war.model.makeGameBusy(), false);
    assert.deepEqual(war.saved, []);
    assert.match(war.errors[0], /^Error: no record\n\s+at /);
    assert.equal(
      war.errors[1],
      "Failed to generate valid war: Error: no record"
    );
  });

  // The system loader the galaxy build makes can be Shared Systems for
  // Galactic War's.
  it("reports a galaxy build's throw as a bug", () => {
    const war = makeWar();
    war.buildThrows = new Error("Shared Systems failed");

    war.start();

    assert.equal(war.builds.length, 1);
    assert.match(war.model.gwoWarGenerationError(), /because of a bug/);
    assert.equal(war.generatingWar(), false);
    assert.equal(
      war.errors[1],
      "Failed to generate valid war: Error: Shared Systems failed"
    );
  });
});

describe("a war another run has taken over", () => {
  const takenOver = (war) => {
    assert.deepEqual(war.saved, []);
    assert.equal(war.window.location.href, GW_START);
    assert.equal(war.model.gwoWarGenerationError(), "");
    assert.equal(war.settingsSaved, 0);
  };

  it("is not dealt its loadout once the galaxy is built", () => {
    const war = makeWar();
    war.holdBuild = true;
    war.start();

    war.model.makeGameBusy({});
    war.build.resolve(war.game().galaxy());

    assert.deepEqual(war.dealt, []);
    assert.equal(war.game().gameState(), undefined);
    takenOver(war);
  });

  it("is not moved into once the loadout is dealt", () => {
    const war = makeWar();
    war.cards[START_CARD].keep = () => war.model.makeGameBusy({});

    war.start();

    assert.equal(war.game().currentStar(), undefined);
    assert.deepEqual(war.breeds, []);
    takenOver(war);
  });

  it("is not peopled once its AIs are placed", () => {
    const war = makeWar();
    war.modules.gwoTeams.makeBoss = (star, ai) => {
      war.model.makeGameBusy({});
      return war.$.when(ai);
    };

    war.start();

    assert.deepEqual(war.populated, []);
    takenOver(war);
  });

  it("is not recorded once its AIs are peopled", () => {
    const war = makeWar();
    war.onPopulate = () => war.model.makeGameBusy({});

    war.start();

    assert.deepEqual(war.records, []);
    takenOver(war);
  });

  it("is not stored once it is recorded", () => {
    const war = makeWar();
    war.onRecord = () => war.model.makeGameBusy({});

    war.start();

    assert.notEqual(war.model.newGame(), war.game());
    takenOver(war);
  });

  it("is not saved once it is stored", () => {
    const war = makeWar();
    war.model.newGame.subscribe(() => war.model.makeGameBusy({}));

    war.start();

    assert.deepEqual(war.logged, []);
    takenOver(war);
  });

  it("only logs a failure", () => {
    const war = makeWar();
    war.holdBuild = true;
    war.start();

    const owner = {};
    war.model.makeGameBusy(owner);
    war.build.reject("no usable star system");

    assert.deepEqual(war.errors, ["no usable star system"]);
    assert.equal(war.model.makeGameBusy(), owner);
    assert.equal(war.generatingWar(), true);
    takenOver(war);
  });
});

describe("the seed, galaxy size, and AI brains", () => {
  it("are read once, when the run starts", () => {
    const war = makeWar();
    war.holdBuild = true;
    war.start();

    war.model.newGameSeed("rerolled");
    war.model.newGameSizeIndex(4);
    war.model.gwoDifficultySettings.aiAlly("Queller");
    war.build.resolve(war.game().galaxy());

    assert.equal(war.records[0].seed, "base-seed");
    assert.equal(war.records[0].galaxySize, "!LOC:Medium");
    assert.equal(war.records[0].brains.aiAlly, "Titans");
    assert.equal(war.populated[0].war.brains.aiAlly, "Titans");
  });
});

describe("the star systems", () => {
  const withSharedSystems = () => {
    const war = makeWar();
    war.sharedSystems = true;
    return war;
  };

  it("come from GWO's own templates without Shared Systems", () => {
    const war = makeWar();
    let asked = 0;
    war.loadOptions = () => {
      asked++;
      return war.$.Deferred().promise();
    };

    war.start();

    assert.equal(asked, 0);
    assert.equal(war.builds[0].gwoSystemBrackets, undefined);
    assert.equal(war.builds[0].gwoBiomeProviders, undefined);
    assert.equal(war.saved.length, 1);
  });

  it("come from the selected sources' brackets under Shared Systems", () => {
    const war = withSharedSystems();

    war.start();

    assert.deepEqual(war.builds[0].gwoSystemBrackets, [
      { min: 0, max: 32, systems: [usable] },
    ]);
    assert.deepEqual(war.builds[0].gwoBiomeProviders, { lava: "provider" });
    assert.deepEqual(war.pools[0].providers, { lava: "provider" });
    assert.equal(war.populated[0].war.sharedSystems, true);
  });

  it("come from the loader when Shared Systems cannot list its sources", () => {
    const war = withSharedSystems();
    delete war.modules.chooseStarSystemTemplates.loadOptions;

    war.start();

    assert.equal(war.builds[0].gwoSystemBrackets, undefined);
    assert.deepEqual(war.pools, []);
  });

  it("come from the loader when Shared Systems has no selection to read", () => {
    const war = withSharedSystems();
    delete war.model.selectedNames;

    war.start();

    assert.equal(war.builds[0].gwoSystemBrackets, undefined);
  });

  it("come from the loader when every source loads but nothing is usable", () => {
    const war = withSharedSystems();
    war.options[0].load = () => war.$.Deferred().resolve([unusable]).promise();

    war.start();

    assert.equal(war.builds.length, 1);
    assert.equal(war.builds[0].gwoSystemBrackets, undefined);
  });

  it("still load when the mounted mods could not be read", () => {
    const war = withSharedSystems();
    war.mounted = engineSettled(false, new Error("no mods"));

    war.start();

    assert.equal(war.builds[0].gwoSystemBrackets.length, 1);
  });

  it("skip a source that throws", () => {
    const war = withSharedSystems();
    war.model.selectedNames(["Broken", "Uber", "Not Listed"]);
    war.options.push({
      name: "Broken",
      load: () => {
        throw new Error("broken source");
      },
    });

    war.start();

    assert.match(
      war.errors[0],
      /^System source failed to load: Broken: Error: broken source/
    );
    assert.deepEqual(war.pools[0].systems, [usable]);
    assert.equal(war.saved.length, 1);
  });

  const failsWithSourcesMessage = (war) => {
    assert.deepEqual(war.builds, []);
    assert.match(war.model.gwoWarGenerationError(), /sources selected/);
    assert.equal(war.generatingWar(), false);
    assert.equal(war.model.makeGameBusy(), false);
    assert.equal(
      war.errors[war.errors.length - 1],
      "Failed to generate valid war: systemSources"
    );
  };

  it("fail the war when no source is selected", () => {
    const war = withSharedSystems();
    war.model.selectedNames([]);

    war.start();

    failsWithSourcesMessage(war);
  });

  it("fail the war when a source fails and the rest give nothing usable", () => {
    const war = withSharedSystems();
    war.model.selectedNames(["Dead", "Odd"]);
    war.options = [
      { name: "Dead", load: () => war.$.Deferred().reject().promise() },
      {
        name: "Odd",
        load: () => war.$.Deferred().resolve([unusable]).promise(),
      },
    ];

    war.start();

    assert.equal(war.errors[0], "System source failed to load: Dead");
    failsWithSourcesMessage(war);
  });

  it("fail the war when the source list fails", () => {
    const war = withSharedSystems();
    war.loadOptions = () => war.$.Deferred().reject().promise();

    war.start();

    assert.equal(war.errors[0], "System sources failed to load");
    failsWithSourcesMessage(war);
  });

  it("fail the war when listing the sources throws", () => {
    const war = withSharedSystems();
    war.loadOptions = () => {
      throw new Error("no list");
    };

    war.start();

    assert.match(
      war.errors[0],
      /^System sources failed to load: Error: no list/
    );
    failsWithSourcesMessage(war);
  });
});
