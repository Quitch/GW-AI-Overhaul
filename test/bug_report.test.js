"use strict";

// shared/bug_report.js: the Report a Galactic War Bug form's prefill.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { MOD_ROOT, loadCouiModule } = require("../scripts/lib/amd-loader.js");

const bugReport = loadCouiModule(MOD_ROOT + "/shared/bug_report.js");

const FORM =
  "https://github.com/Quitch/GW-AI-Overhaul/issues/new?template=bug_report.yml";

const SETTINGS = {
  version: "7.4.0",
  seed: "123456",
  difficulty: "!LOC:Gold",
  galaxySize: "!LOC:Large",
  ai: "Penchant",
  aiAlly: "Titans",
  techCardDeck: "Expanded",
  factionScaling: true,
  staticTech: true,
  races: {
    unique: true,
    mods: [
      { identifier: "com.pa.legion", displayName: "Legion", version: "2" },
    ],
    addons: [{ identifier: "com.pa.osmech", displayName: "Osmech" }],
  },
  biomeMods: [{ identifier: "com.pa.maps", displayName: "Maps", version: "1" }],
};

const settingsWith = (extra) => Object.assign({}, SETTINGS, extra);

const decode = (url) => Object.fromEntries(new URL(url).searchParams.entries());

describe("english", () => {
  it("strips the !LOC: prefix and leaves other values alone", () => {
    assert.equal(bugReport.english("!LOC:Gold"), "Gold");
    assert.equal(bugReport.english("Gold"), "Gold");
    assert.equal(bugReport.english(undefined), undefined);
  });
});

describe("sceneOf", () => {
  it("names each scene the button is in, and nothing else", () => {
    const path = (scene) => "/ui/main/game/galactic_war/" + scene + "/x.html";
    assert.equal(bugReport.sceneOf(path("gw_start")), "War setup");
    assert.equal(bugReport.sceneOf(path("gw_play")), "Galaxy map");
    assert.equal(
      bugReport.sceneOf("/ui/main/game/live_game/live_game.html"),
      "During a battle"
    );
    assert.equal(
      bugReport.sceneOf("/ui/main/game/start/start.html"),
      undefined
    );
    assert.equal(bugReport.sceneOf(undefined), undefined);
  });
});

describe("optionKeys", () => {
  it("lists the options that are on, in the panel's order", () => {
    assert.deepEqual(bugReport.optionKeys(SETTINGS, true), [
      "!LOC:Faction Scaling",
      "!LOC:Static tech",
      "!LOC:Unique races",
      "!LOC:Hardcore mode",
    ]);
  });

  it("copes with no settings", () => {
    assert.deepEqual(bugReport.optionKeys(undefined, false), []);
  });
});

describe("deckName", () => {
  it("prefers the registered name, then the built-in rule, then the id", () => {
    assert.equal(bugReport.deckName("Basic", "!LOC:Basic"), "Basic");
    assert.equal(bugReport.deckName(undefined), "Galactic War Overhaul");
    assert.equal(bugReport.deckName("Expanded"), "Galactic War Overhaul");
    assert.equal(bugReport.deckName("their_deck"), "their_deck");
  });
});

describe("winConditions", () => {
  it("lists sudden death over eradication, and bounties", () => {
    assert.equal(
      bugReport.winConditions({
        sudden_death_mode: true,
        eradication_mode: true,
        bounty_mode: true,
        bounty_value: 0.5,
      }),
      "Sudden Death, Bounties x0.5"
    );
  });

  it("names eradication's extra targets", () => {
    assert.equal(
      bugReport.winConditions({
        eradication_mode: true,
        eradication_mode_factories: true,
        eradication_mode_fabricators: true,
      }),
      "Eradication (factories, fabricators)"
    );
    assert.equal(
      bugReport.winConditions({ eradication_mode: true }),
      "Eradication"
    );
  });

  it("says Standard with no modifiers, and nothing without options", () => {
    assert.equal(bugReport.winConditions({ bounty_mode: false }), "Standard");
    assert.equal(bugReport.winConditions({ bounty_mode: true }), "Bounties");
    assert.equal(bugReport.winConditions(undefined), undefined);
  });
});

describe("warLines", () => {
  it("reports a war in English, with the battle when there is one", () => {
    assert.deepEqual(
      bugReport.warLines({
        running: "7.5.0",
        settings: settingsWith({
          aiByRace: { legion: { enemy: "Penchant", ally: "Old", coop: "Q" } },
        }),
        hardcore: false,
        warName: "My war",
        factionName: "!LOC:Legonis Machina",
        raceName: "!LOC:Legion",
        commander: "/pa/units/commanders/a/a.json",
        loadout: "gwc_start_vehicle",
        battle: {
          system: "Alpha",
          enemy: "Enemy One",
          gameOptions: { bounty_mode: true, bounty_value: 2 },
        },
      }),
      [
        "- GWO running: 7.5.0",
        "- War created with GWO: 7.4.0",
        "- War: My war",
        "- Seed: 123456",
        "- Difficulty: Gold",
        "- Size: Large",
        "- Opponent AI: Penchant",
        "- Ally AI: Titans",
        "- Co-op AI: Penchant",
        "- AI by race: legion (enemy Penchant, ally Old, co-op Q)",
        "- Deck: Galactic War Overhaul",
        "- Options: Faction Scaling, Static tech, Unique races",
        "- Faction: Legonis Machina",
        "- Race: Legion",
        "- Commander: /pa/units/commanders/a/a.json",
        "- Loadout: gwc_start_vehicle",
        "- System: Alpha",
        "- Enemy: Enemy One",
        "- Win conditions: Bounties x2",
      ]
    );
  });

  it("leaves out what is missing rather than show undefined", () => {
    const lines = bugReport.warLines({ settings: { ai: "Titans" } });
    assert.deepEqual(lines, [
      "- Opponent AI: Titans",
      "- Ally AI: Titans",
      "- Co-op AI: Titans",
      "- Deck: Galactic War Overhaul",
    ]);
  });

  it("gives only the version without settings", () => {
    assert.deepEqual(bugReport.warLines({ running: "7.5.0" }), [
      "- GWO running: 7.5.0",
    ]);
    assert.deepEqual(bugReport.warLines({}), []);
  });

  it("says a stale viewer copy is out of date instead of reporting it", () => {
    assert.deepEqual(
      bugReport.warLines({ running: "7.5.0", stale: true, settings: SETTINGS }),
      ["- GWO running: 7.5.0", "- War copy on this viewer is out of date"]
    );
  });
});

describe("coopLines", () => {
  it("is empty for a solo war", () => {
    assert.deepEqual(bugReport.coopLines(undefined), []);
    assert.deepEqual(bugReport.coopLines({ role: "solo", createdFor: 1 }), []);
  });

  it("reports a co-op campaign", () => {
    assert.deepEqual(
      bugReport.coopLines({
        role: "host",
        playersNow: 3,
        coopAiCount: 1,
        createdFor: 2,
        sharedArmies: false,
        perPlayerTech: true,
        maxClients: 4,
        slotsLocked: true,
      }),
      [
        "- Role: host",
        "- Players now: 3 (1 co-op AI)",
        "- Players the war was created for: 2",
        "- Shared Armies: No",
        "- Per-Player Tech: Yes",
        "- Player slots: 4 (locked)",
      ]
    );
  });

  it("reports a war set up for several players before any campaign", () => {
    assert.deepEqual(bugReport.coopLines({ createdFor: 3 }), [
      "- Players the war was created for: 3",
    ]);
    assert.deepEqual(
      bugReport.coopLines({
        role: "solo",
        playersNow: 0,
        createdFor: 2,
        sharedArmies: true,
        maxClients: 1,
        slotsLocked: false,
      }),
      ["- Players the war was created for: 2"]
    );
  });

  it("leaves out what a battle could not read", () => {
    assert.deepEqual(
      bugReport.coopLines({
        role: "viewer",
        playersNow: 2,
        coopAiCount: 0,
        sharedArmies: true,
        maxClients: 2,
      }),
      [
        "- Role: viewer",
        "- Players now: 2",
        "- Shared Armies: Yes",
        "- Player slots: 2",
      ]
    );
  });
});

describe("modLines", () => {
  const client = [
    {
      display_name: "Galactic War Overhaul",
      version: "7.5.0",
      identifier: "com.pa.quitch.gwaioverhaul",
    },
  ];

  it("lists the mods and marks the war's mods that are not mounted", () => {
    assert.deepEqual(
      bugReport.modLines({
        client: client,
        server: {
          mods: [
            {
              identifier: "com.pa.legion",
              displayName: "Legion",
              version: "2",
            },
          ],
          known: true,
          gwsm: true,
        },
        hostServer: [{ identifier: "com.pa.host", displayName: "Host mod" }],
        settings: SETTINGS,
      }),
      [
        "Client mods:",
        "  - Galactic War Overhaul 7.5.0 (com.pa.quitch.gwaioverhaul)",
        "Server mods (GW Server Mods):",
        "  - Legion 2 (com.pa.legion)",
        "Host's server mods:",
        "  - Host mod (com.pa.host)",
        "War's race mods:",
        "  - Legion 2 (com.pa.legion)",
        "War's add-on mods:",
        "  - Osmech (com.pa.osmech) - not mounted",
        "War's map pack mods:",
        "  - Maps 1 (com.pa.maps) - not mounted",
      ]
    );
  });

  it("says when GW Server Mods is not running", () => {
    const lines = bugReport.modLines({
      client: client,
      server: { mods: [], known: true, gwsm: false },
      settings: { races: { mods: SETTINGS.races.mods } },
    });
    assert.deepEqual(lines.slice(2), [
      "Server mods: GW Server Mods is not running",
      "War's race mods:",
      "  - Legion 2 (com.pa.legion) - not mounted",
    ]);
  });

  it("marks nothing when the server mod list cannot be read", () => {
    const lines = bugReport.modLines({
      client: client,
      server: { mods: [], known: false, gwsm: true },
      settings: { races: { mods: SETTINGS.races.mods } },
    });
    assert.equal(lines.at(-1), "  - Legion 2 (com.pa.legion)");
  });

  it("is empty when no mod list was gathered", () => {
    assert.deepEqual(bugReport.modLines({ settings: SETTINGS }), []);
  });
});

describe("fields and buildUrl", () => {
  it("encodes every filled field and leaves out the empty ones", () => {
    const url = bugReport.buildUrl(
      bugReport.fields("Galaxy map", {
        running: "7.5.0",
        language: "de-DE",
      })
    );
    assert.ok(url.startsWith(FORM + "&"));
    assert.deepEqual(decode(url), {
      template: "bug_report.yml",
      scene: "Galaxy map",
      war: "- GWO running: 7.5.0",
      language: "de-DE",
    });
  });

  it("opens with only the scene when nothing was gathered", () => {
    assert.equal(
      bugReport.buildUrl(bugReport.fields("During a battle")),
      FORM + "&scene=During%20a%20battle"
    );
    assert.equal(bugReport.buildUrl(bugReport.fields(undefined)), FORM);
  });

  it("encodes characters a URL would otherwise break on", () => {
    const url = bugReport.buildUrl({ war: "a&b=c #d\ne" });
    assert.equal(decode(url).war, "a&b=c #d\ne");
  });

  it("cuts the mod list first to keep within the budget", () => {
    const mods = Array.from({ length: 400 }, (_, i) => "  - mod " + i).join(
      "\n"
    );
    const url = bugReport.buildUrl({
      war: "- War: x",
      coop: "- Role: host",
      mods,
    });
    const values = decode(url);

    assert.ok(url.length <= bugReport.URL_BUDGET);
    assert.ok(url.length > bugReport.URL_BUDGET - 50);
    assert.equal(values.war, "- War: x");
    assert.equal(values.coop, "- Role: host");
    assert.ok(values.mods.startsWith("  - mod 0\n"));
    assert.ok(values.mods.endsWith("\n(list truncated)"));
  });

  it("moves on to co-op and the war when the mod list is not enough", () => {
    const long = (prefix) =>
      Array.from({ length: 1500 }, (_, i) => prefix + i).join("\n");
    const values = decode(
      bugReport.buildUrl({ war: long("w"), coop: long("c"), mods: long("m") })
    );

    assert.equal(values.mods, "(list truncated)");
    assert.equal(values.coop, "(list truncated)");
    assert.ok(values.war.startsWith("w0\n"));
    assert.ok(values.war.endsWith("\n(list truncated)"));
  });

  it("leaves a URL within budget untouched", () => {
    const values = { scene: "Galaxy map", mods: "Client mods:" };
    assert.equal(
      bugReport.buildUrl(values),
      FORM + "&scene=Galaxy%20map&mods=Client%20mods%3A"
    );
  });
});

describe("logText", () => {
  it("heads the entry and gives each filled field in form order", () => {
    const text = bugReport.logText(
      {
        language: "de-DE",
        mods: "Client mods:\n  - GWO 7.5.0 (com.pa.quitch.gwaioverhaul)",
        war: "- GWO running: 7.5.0\n- Seed: 123456",
        scene: "Galaxy map",
      },
      "galaxy map loaded"
    );
    assert.equal(
      text,
      [
        "[GWO] bug report context: galaxy map loaded",
        "Where it happened: Galaxy map",
        "GWO info:",
        "- GWO running: 7.5.0",
        "- Seed: 123456",
        "Mods:",
        "Client mods:",
        "  - GWO 7.5.0 (com.pa.quitch.gwaioverhaul)",
        "Game language: de-DE",
      ].join("\n")
    );
  });

  it("leaves out empty fields and never prints undefined", () => {
    const text = bugReport.logText(bugReport.fields(undefined, {}));
    assert.equal(text, "[GWO] bug report context");
    assert.equal(bugReport.logText(undefined), "[GWO] bug report context");
  });

  it("logs the same values the form is filled with", () => {
    const values = bugReport.fields("During a battle", {
      running: "7.5.0",
      settings: SETTINGS,
      coop: { role: "host", playersNow: 2 },
    });
    const text = bugReport.logText(values, "battle loaded");
    assert.ok(text.includes("GWO info:\n" + values.war + "\n"));
    assert.ok(text.endsWith("Co-op:\n" + values.coop));
    assert.equal(text.includes("undefined"), false);
  });
});

describe("heldCards and inventoryInput", () => {
  const ids = ["gwc_start_air", "gwc_enable_bots", "gwc_enable_bots"];
  const live = {
    cards: () => ids.map((id) => ({ id })),
    getTag: (context, name) =>
      context === "global" && name === "commander" ? "live_cmdr" : undefined,
  };
  const record = {
    cards: ids.map((id) => ({ id })),
    tags: { global: { commander: "record_cmdr" } },
  };

  it("reads card IDs in order, duplicates kept, from either shape", () => {
    assert.deepEqual(bugReport.heldCards(live), ids);
    assert.deepEqual(bugReport.heldCards(record), ids);
    assert.deepEqual(bugReport.heldCards({}), []);
    assert.equal(bugReport.heldCards(undefined), undefined);
  });

  it("takes the loadout and commander from the same inventory", () => {
    assert.deepEqual(bugReport.inventoryInput(live), {
      cards: ids,
      loadout: "gwc_start_air",
      commander: "live_cmdr",
    });
    assert.deepEqual(bugReport.inventoryInput(record), {
      cards: ids,
      loadout: "gwc_start_air",
      commander: "record_cmdr",
    });
  });

  it("gives nothing when there is no inventory", () => {
    assert.deepEqual(bugReport.inventoryInput(undefined), {});
  });
});

describe("cardLines", () => {
  it("lists each card ID in order, duplicates kept", () => {
    assert.deepEqual(bugReport.cardLines({ cards: ["a", "b", "a"] }), [
      "- a",
      "- b",
      "- a",
    ]);
  });

  it("is empty without cards", () => {
    assert.deepEqual(bugReport.cardLines({ cards: [] }), []);
    assert.deepEqual(bugReport.cardLines({}), []);
    assert.deepEqual(bugReport.cardLines(undefined), []);
  });
});

describe("tech cards in the report", () => {
  it("fills the cards field only when cards are present", () => {
    assert.equal(
      bugReport.fields("Galaxy map", { cards: ["a", "b"] }).cards,
      "- a\n- b"
    );
    const values = bugReport.fields("Galaxy map", { running: "7.5.0" });
    assert.equal(values.cards, "");
    assert.equal("cards" in decode(bugReport.buildUrl(values)), false);
  });

  it("logs the cards under Tech cards, after the war", () => {
    const text = bugReport.logText(
      bugReport.fields("Galaxy map", {
        running: "7.5.0",
        cards: ["a", "b"],
        coop: { role: "host" },
      })
    );
    assert.ok(
      text.includes(
        "GWO info: - GWO running: 7.5.0\nTech cards:\n- a\n- b\nCo-op: "
      )
    );
  });

  it("cuts the cards first and keeps the mod list whole", () => {
    const cards = Array.from({ length: 1000 }, (_, i) => "- card_" + i).join(
      "\n"
    );
    const mods = Array.from({ length: 25 }, (_, i) => "  - mod " + i).join(
      "\n"
    );
    const url = bugReport.buildUrl({
      war: "- War: x",
      cards,
      coop: "- Role: host",
      mods,
    });
    const values = decode(url);

    assert.ok(url.length <= bugReport.URL_BUDGET);
    assert.ok(values.cards.startsWith("- card_0\n"));
    assert.ok(values.cards.endsWith("\n(list truncated)"));
    assert.equal(values.mods, mods);
    assert.equal(values.coop, "- Role: host");
    assert.equal(values.war, "- War: x");
  });
});
