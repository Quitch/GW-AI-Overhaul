"use strict";

// gw_play/gwo_panel_view.js: what the war information panel shows. The scene
// script, gw_play/gwo_panel.js, keeps the model glue; gwo_panel.test.js runs
// its loader.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const _ = require("lodash");
const { MOD_ROOT, loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const { makeObservable } = require("../scripts/lib/fake-knockout.js");

const view = loadCouiModule(MOD_ROOT + "/gw_play/gwo_panel_view.js");
const races = loadCouiModule(MOD_ROOT + "/shared/races.js");
const decks = loadCouiModule(MOD_ROOT + "/shared/decks.js");
const gwoColour = loadCouiModule(MOD_ROOT + "/gw_play/commander_colour.js");

const stubs = createGlobalStubs();

afterEach(() => stubs.restoreGlobals());

const HOST_COLOUR = [
  [10, 20, 30],
  [40, 50, 60],
];
const HOST = { id: "1", name: "Host", role: "host" };
const VIEWER = { id: "2", name: "Viewer", role: "viewer" };
const LABELS = { expanded: "Galactic War Overhaul", missing: "missing:" };
const DUPLICATION = { id: "gwaio_upgrade_subcommander_duplication" };

const icon = (raceId) => races.byId(raceId).playerIcon;

function captureErrors() {
  const errors = [];
  stubs.setGlobal("console", {
    error: (text) => errors.push(text),
  });
  return errors;
}

// The scene the commander list reads: the session observables on model, the
// host's game and inventory, and requireGW answered by the test through
// `pending`. `records` are the co-op records, keyed by playerId.
function installScene(options = {}) {
  const scene = { requested: [], pending: {}, records: [] };
  const model = {
    displayName: makeObservable("Host"),
    gwoLoadout: makeObservable("Air Start"),
    gwCampaignActive: makeObservable(Boolean(options.clients)),
    gwCampaignConnectedClients: makeObservable(options.clients || []),
    gwCampaignPerPlayerTechCards: makeObservable(Boolean(options.perPlayer)),
    gwCoopPlayerColors: makeObservable(options.colours || []),
    gwoCoopAi: { panel: makeObservable(options.ais || []) },
  };
  stubs.setGlobal("model", model);
  stubs.setGlobal("ko", { observable: makeObservable });
  stubs.setGlobal("requireGW", (deps, callback) => {
    scene.requested.push(deps[0]);
    scene.pending[deps[0]] = callback;
  });

  const game = {
    perPlayerTechCards: model.gwCampaignPerPlayerTechCards,
    coopPlayerInventoryData: () => scene.records,
    findCoopPlayerInventoryData: (player) =>
      _.find(scene.records, { playerId: player.id }),
  };
  const inventory = {
    getTag: (context, key) => (key === "playerColor" ? HOST_COLOUR : undefined),
    cards: () => options.cards || [],
    minions: () => options.minions || [],
  };

  scene.model = model;
  scene.list = view.commanderList({
    game: game,
    inventory: inventory,
    factionIndex: options.factionIndex || 0,
    playerRace: options.race || races.MLA_ID,
  });
  return scene;
}

describe("cardName", () => {
  it("names a card by its summary", () => {
    assert.equal(
      view.cardName({ summarize: () => "!LOC:Air Commander" }, "gwc_start_air"),
      "!LOC:Air Commander"
    );
  });

  it("is empty for a card with no summary", () => {
    assert.equal(view.cardName(undefined, "gwc_start_air"), "");
    assert.equal(view.cardName({}, "gwc_start_air"), "");
  });

  // A third-party card's summarize() is arbitrary code.
  it("logs, and is empty, when the summary throws", () => {
    const errors = captureErrors();
    const card = {
      summarize: () => {
        throw new Error("no summary");
      },
    };

    assert.equal(view.cardName(card, "mym_start"), "");
    assert.equal(errors.length, 1);
    assert.match(errors[0], /^GWO card summarize\(\) threw for mym_start: /);
  });

  it("logs an error that carries no stack by its message", () => {
    const errors = captureErrors();
    const error = new Error("no summary");
    error.stack = undefined;
    const card = {
      summarize: () => {
        throw error;
      },
    };

    assert.equal(view.cardName(card, "mym_start"), "");
    assert.deepEqual(errors, [
      "GWO card summarize() threw for mym_start: Error: no summary",
    ]);
  });
});

describe("registeredDeckName", () => {
  it("names a registered deck", () => {
    assert.equal(
      view.registeredDeckName(decks.byId("Basic"), "Basic", LABELS),
      "!LOC:Basic"
    );
  });

  // decks.cardsFor deals the Expanded deck for a deck whose mod is gone.
  it("names the Expanded deck and the missing id for a deck whose mod is gone", () => {
    assert.equal(
      view.registeredDeckName(undefined, "mym_deck", LABELS),
      "Galactic War Overhaul (missing: mym_deck)"
    );
  });

  it("leaves the provisional name for a war that recorded no deck", () => {
    assert.equal(
      view.registeredDeckName(undefined, undefined, LABELS),
      undefined
    );
  });
});

describe("brainSummaryFor", () => {
  it("names one brain per side for an MLA war", () => {
    const summary = view.brainSummaryFor({ ai: "Queller", aiAlly: "Titans" });

    assert.equal(summary("enemy"), "Queller");
    assert.equal(summary("ally"), "Titans");
    // A war saved before the co-op column: co-op follows the opponent.
    assert.equal(summary("coop"), "Queller");
  });

  it("names one brain when every race resolves to the same one", () => {
    const summary = view.brainSummaryFor({
      ai: "Titans",
      aiByRace: { legion: { enemy: "Titans" } },
      races: { player: "legion", byFaction: { 0: "bugs" } },
    });

    assert.equal(summary("enemy"), "Titans");
  });

  // Queller has no Bugs build orders, so Bugs falls back to Titans.
  it("lists each race's brain when the races differ", () => {
    const summary = view.brainSummaryFor({
      ai: "Queller",
      aiAlly: "Queller",
      races: { player: "legion", byFaction: { 0: "bugs", 1: "legion" } },
    });

    assert.equal(
      summary("enemy"),
      "!LOC:MLA: Queller, !LOC:Legion: Queller, !LOC:Bugs: Titans"
    );
  });

  it("names a race nothing registered by its id", () => {
    const summary = view.brainSummaryFor({
      ai: "Penchant",
      races: { byFaction: { 0: "legion", 1: "zeta" } },
    });

    assert.equal(
      summary("enemy"),
      "!LOC:MLA: Penchant, !LOC:Legion: Titans, zeta: Penchant"
    );
  });

  it("reads the races a caller names instead of the war's", () => {
    const summary = view.brainSummaryFor({
      ai: "Queller",
      races: { player: "legion" },
    });

    assert.equal(summary("coop", ["bugs"]), "Titans");
  });
});

describe("incompatibleModNames", () => {
  it("names the mounted mods on the list, sorted by display name", () => {
    const mods = [
      {
        identifier: "com.pa.client.mirolog.boom",
        display_name: "Bigger Explosions",
      },
      { identifier: "com.example.harmless", display_name: "A Harmless Mod" },
      { identifier: "com.heiz.aurora_arty", display_name: "Aurora Artillery" },
    ];

    assert.deepEqual(view.incompatibleModNames(mods), [
      "Aurora Artillery",
      "Bigger Explosions",
    ]);
  });

  it("is empty when no mounted mod is on the list", () => {
    assert.deepEqual(
      view.incompatibleModNames([
        { identifier: "com.example.harmless", display_name: "A Harmless Mod" },
      ]),
      []
    );
  });

  it("names a mod mounted twice once, by its first display name", () => {
    const mods = [
      { identifier: "com.uberent.pa.PAFX", display_name: "PA-FX Titans" },
      { identifier: "com.uberent.pa.PAFX", display_name: "PA-FX (copy)" },
    ];

    assert.deepEqual(view.incompatibleModNames(mods), ["PA-FX Titans"]);
  });
});

describe("commanderList", () => {
  it("shows the host alone outside a co-op session", () => {
    const scene = installScene();
    const commanders = scene.list("Human");

    assert.equal(commanders.length, 1);
    assert.equal(commanders[0].name, scene.model.displayName);
    assert.equal(commanders[0].color, "rgb(10,20,30)");
    assert.equal(commanders[0].character, scene.model.gwoLoadout);
    // MLA has no icon of its own, so the panel shows stock's.
    assert.equal(commanders[0].iconFill, undefined);
    assert.equal(commanders[0].iconOutline, undefined);
  });

  it("shows the host's race icon", () => {
    const [host] = installScene({ race: "legion" }).list("Human");

    assert.equal(host.iconFill, icon("legion").fill);
    assert.equal(host.iconOutline, icon("legion").outline);
  });

  it("lists every connected client in a session, in the order given", () => {
    const scene = installScene({ clients: [VIEWER, HOST] });

    assert.deepEqual(_.pluck(scene.list("Human"), "name"), ["Viewer", "Host"]);
  });

  // The swatch is the colour the battle gives the client.
  it("colours each client as the base game resolved, else as the host", () => {
    const scene = installScene({
      clients: [HOST, VIEWER],
      colours: [
        {
          id: "1",
          name: "Host",
          color: [
            [1, 2, 3],
            [4, 5, 6],
          ],
        },
      ],
    });
    const [host, viewer] = scene.list("Human");

    assert.equal(host.color(), "rgb(1,2,3)");
    assert.equal(viewer.color(), "rgb(10,20,30)");
  });

  it("gives every human the host's loadout under shared tech", () => {
    const scene = installScene({ clients: [HOST, VIEWER] });
    scene.records.push({ playerId: "2", loadoutCardId: "gwc_start_bot" });
    const [host, viewer] = scene.list("Human");

    assert.equal(host.character, scene.model.gwoLoadout);
    assert.equal(viewer.character, scene.model.gwoLoadout);
    assert.deepEqual(scene.requested, []);
  });

  it("names a viewer's own loadout once their record has it, under per-player tech", () => {
    const scene = installScene({ clients: [HOST, VIEWER], perPlayer: true });
    const [host, viewer] = scene.list("Human");

    assert.equal(host.character, scene.model.gwoLoadout);
    assert.equal(viewer.character(), "Human");

    scene.records.push({ playerId: "2", loadoutCardId: "gwc_start_bot" });
    scene.list("Human");
    scene.list("Human");
    assert.deepEqual(scene.requested, ["cards/gwc_start_bot"]);

    scene.pending["cards/gwc_start_bot"]({
      summarize: () => "!LOC:Bot Commander",
    });
    assert.equal(viewer.character(), "!LOC:Bot Commander");
  });

  it("shows the placeholder for a client that is neither host nor viewer", () => {
    const scene = installScene({
      clients: [HOST, { id: "3", name: "Guest", role: "spectator" }],
    });

    assert.equal(scene.list("Human")[1].character(), "Human");
  });

  // So loadout text that arrives later does not flicker.
  it("keeps a client's commander across evaluations", () => {
    const scene = installScene({ clients: [HOST, VIEWER] });
    const viewer = scene.list("Human")[1];

    assert.equal(scene.list("Human")[1], viewer);
  });

  it("drops a client that leaves, and builds anew when they return", () => {
    const scene = installScene({ clients: [HOST, VIEWER] });
    const viewer = scene.list("Human")[1];

    scene.model.gwCampaignConnectedClients([HOST]);
    assert.equal(scene.list("Human").length, 1);

    scene.model.gwCampaignConnectedClients([HOST, VIEWER]);
    assert.notEqual(scene.list("Human")[1], viewer);
  });

  // Under Separate races a viewer's race is known only once it syncs.
  it("takes a viewer's race icon from their record once it syncs", () => {
    const scene = installScene({ clients: [HOST, VIEWER], race: "legion" });
    const viewer = scene.list("Human")[1];

    assert.equal(viewer.iconFill(), icon("legion").fill);

    scene.records.push({
      playerId: "2",
      inventory: { tags: { global: { playerRace: "bugs" } } },
    });
    scene.list("Human");
    assert.equal(viewer.iconFill(), icon("bugs").fill);
    assert.equal(viewer.iconOutline(), icon("bugs").outline);
  });

  it("lists co-op AI players after the humans", () => {
    const scene = installScene({
      clients: [HOST],
      ais: [
        {
          name: "AI One",
          colour: [
            [7, 8, 9],
            [1, 1, 1],
          ],
          race: "mla",
        },
        { name: "AI Two", race: "bugs" },
      ],
    });
    const [, one, two] = scene.list("Human");

    assert.equal(one.name, "AI One");
    assert.equal(one.color, "rgb(7,8,9)");
    assert.equal(one.character, scene.model.gwoLoadout);
    assert.equal(two.color, "rgb(10,20,30)");
    assert.equal(two.iconFill, icon("bugs").fill);
    assert.equal(two.iconOutline, icon("bugs").outline);
  });

  it("names a co-op AI player's own loadout, one lookup per loadout", () => {
    const scene = installScene({
      clients: [HOST],
      ais: [
        { name: "AI One", race: "mla", loadoutCardId: "gwc_start_air" },
        { name: "AI Two", race: "mla", loadoutCardId: "gwc_start_air" },
      ],
    });
    const [, one, two] = scene.list("Human");
    scene.list("Human");

    assert.equal(one.character, two.character);
    assert.deepEqual(scene.requested, ["cards/gwc_start_air"]);

    scene.pending["cards/gwc_start_air"]({
      summarize: () => "!LOC:Air Commander",
    });
    assert.equal(one.character(), "!LOC:Air Commander");
  });

  it("shows the player's race icon for a race nothing registered", () => {
    const scene = installScene({
      clients: [HOST],
      race: "legion",
      ais: [{ name: "AI One", race: "zeta" }],
    });

    assert.equal(scene.list("Human")[1].iconFill, icon("legion").fill);
  });

  it("leaves co-op AI players out of a war with no session", () => {
    const scene = installScene({ ais: [{ name: "AI One", race: "mla" }] });

    assert.equal(scene.list("Human").length, 1);
  });

  it("lists Sub Commanders after the players, in palette order", () => {
    const sub = {
      name: "Sub",
      color: [
        [1, 1, 1],
        [2, 2, 2],
      ],
      character: "!LOC:Tactician",
    };
    const guardian = {
      name: "Guard",
      color: [
        [255, 255, 255],
        [0, 0, 0],
      ],
      character: "!LOC:Guardian",
      race: "bugs",
    };
    const scene = installScene({
      minions: [sub, guardian],
      factionIndex: 4,
      race: "legion",
    });
    const [, first, second] = scene.list("Human");

    assert.equal(first.name, "Sub");
    assert.equal(first.color, gwoColour.rgb(gwoColour.pick(4, sub.color, 1)));
    assert.equal(first.character, "!LOC:Tactician");
    assert.equal(first.iconFill, icon("legion").fill);
    assert.equal(second.color, "rgb(255,255,255)");
    assert.equal(second.iconFill, icon("bugs").fill);
  });

  it("marks a duplicated Sub Commander without renaming it", () => {
    const sub = {
      name: "Sub",
      color: HOST_COLOUR,
      character: "!LOC:Tactician",
    };
    const scene = installScene({ minions: [sub], cards: [DUPLICATION] });

    assert.equal(scene.list("Human")[1].name, "Sub x2");
    assert.equal(sub.name, "Sub");
  });

  // The order the battle config numbers the colours in.
  it("numbers the host's Sub Commanders before a viewer's, under per-player tech", () => {
    const scene = installScene({
      clients: [VIEWER, HOST],
      perPlayer: true,
      minions: [{ name: "Host Sub", color: HOST_COLOUR, character: "" }],
    });
    scene.records.push({
      playerId: "2",
      inventory: {
        cards: [],
        minions: [{ name: "Viewer Sub", color: HOST_COLOUR, character: "" }],
      },
    });
    const subs = scene.list("Human").slice(2);

    assert.deepEqual(_.pluck(subs, "name"), ["Host Sub", "Viewer Sub"]);
    assert.equal(
      subs[1].color,
      gwoColour.rgb(gwoColour.pick(0, HOST_COLOUR, 2))
    );
  });
});
