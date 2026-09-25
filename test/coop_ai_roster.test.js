"use strict";

// gw_play/coop_ai_roster.js: which co-op records are AI players, what each
// takes in the lobby, and what each brings to a battle. See coop.md, "AI
// players".

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const lodash = require("lodash");

const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { mediaDir } = require("../scripts/lib/pa-install.js");
const { buildGame, useModel } = require("../scripts/lib/ai-path-fixtures.js");
const {
  COMMANDER,
  aiRecord,
  colourResolver,
} = require("../scripts/lib/coop-ai-fixtures.js");
const { FIXTURE_RACE } = require("../scripts/lib/race-fixture.js");

const roster = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_ai_roster.js"
);
const gwoRng = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_rng.js"
);
const races = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js"
);

const installModel = useModel();

// A stock file from the PA install, or undefined without one.
function stockFile(relative) {
  const file = path.join(mediaDir(), relative);
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : undefined;
}

describe("isAiRecord / aiRecords", () => {
  it("knows an AI by gwaioAi alone", () => {
    assert.equal(roster.isAiRecord(aiRecord(1)), true);
    assert.equal(roster.isAiRecord({ playerId: "uber-1" }), false);
    assert.equal(roster.isAiRecord({ gwaioAi: "yes" }), false);
    assert.equal(roster.isAiRecord(undefined), false);
  });

  it("lists AI records in serial order, humans left out", () => {
    const records = [
      aiRecord(3),
      { playerId: "uber-1", playerName: "Alice" },
      aiRecord(1),
    ];
    assert.deepEqual(
      roster.aiRecords(records).map((record) => record.playerId),
      ["gwo_ai_1", "gwo_ai_3"]
    );
    assert.deepEqual(roster.aiRecords(undefined), []);
  });
});

describe("nextAiIdentity", () => {
  it("starts at 1 in a war that never had an AI", () => {
    assert.deepEqual(roster.nextAiIdentity({}), {
      serial: 1,
      playerId: "gwo_ai_1",
    });
    assert.equal(roster.nextAiIdentity(undefined).serial, 1);
  });

  // The counter is what never repeats, not the records: a kicked AI's id is
  // gone from the records but its serial stays spent.
  it("never reuses a serial, whatever records remain", () => {
    const gwaio = {};
    const ids = [];
    for (let i = 0; i < 4; i++) {
      const identity = roster.nextAiIdentity(gwaio);
      gwaio.coopAiSerial = identity.serial;
      ids.push(identity.playerId);
    }
    assert.deepEqual(ids, ["gwo_ai_1", "gwo_ai_2", "gwo_ai_3", "gwo_ai_4"]);
    // No space: gwo_streams.safeLabel would otherwise rewrite the key.
    assert.ok(ids.every((id) => !/\s/.test(id)));
  });
});

describe("aiTag and scopeTokenFor", () => {
  it("shares the host's tag and one tree under shared tech", () => {
    assert.equal(roster.aiTag(0, false, 3), ".player");
    assert.equal(roster.aiTag(2, false, 1), ".player");
    assert.equal(roster.scopeTokenFor(aiRecord(4), false), "coopai");
  });

  it("takes the next player tags after the humans under per-player tech", () => {
    // Host .player, viewer .player0; the AIs follow.
    assert.equal(roster.aiTag(0, true, 2), ".player1");
    assert.equal(roster.aiTag(1, true, 2), ".player2");
    // A host alone.
    assert.equal(roster.aiTag(0, true, 1), ".player0");
    assert.equal(roster.scopeTokenFor(aiRecord(4), true), "coopai_4");
  });
});

describe("personalityIdFor", () => {
  it("gives Queller its strongest template and the rest the sharpest", () => {
    assert.equal(roster.personalityIdFor("Queller"), "uber");
    assert.equal(roster.personalityIdFor("Titans"), "absurd");
    assert.equal(roster.personalityIdFor("Penchant"), "absurd");
    assert.equal(roster.CHARACTERS.uber, "!LOC:Uber");
    assert.equal(roster.CHARACTERS.absurd, "!LOC:Absurd");
  });
});

describe("colourPairs", () => {
  it("takes the pairs after every human army", () => {
    const calls = [];
    const pairs = roster.colourPairs({
      resolve: colourResolver(calls),
      humanArmies: 2,
      aiCount: 3,
      faction: "faction",
      factionColour: "colour",
    });
    assert.deepEqual(
      pairs.map((pair) => pair[0][0]),
      [2, 3, 4]
    );
    assert.deepEqual(calls, [
      { count: 5, faction: "faction", factionColour: "colour" },
    ]);
  });

  it("asks for nothing without an AI", () => {
    const calls = [];
    assert.deepEqual(
      roster.colourPairs({
        resolve: colourResolver(calls),
        humanArmies: 1,
        aiCount: 0,
      }),
      []
    );
    assert.equal(calls.length, 0);
  });

  // The stock resolver builds its pairs greedily in order, so asking for more
  // never moves the earlier ones: an AI joining leaves every human's colour.
  it("leaves every earlier pair where the stock resolver put it (skipped without a PA install)", (t) => {
    const source = stockFile(
      "ui/main/game/galactic_war/shared/js/gw_coop_player_colors.js"
    );
    if (!source) {
      t.skip("no PA install");
      return;
    }

    let colours;
    new Function("define", "_", source)((factory) => {
      colours = factory();
    }, lodash);

    const factions = [
      undefined,
      {
        color: [
          [210, 50, 44],
          [51, 151, 197],
        ],
        coopPlayerColors: [
          [210, 50, 44],
          [0, 255, 0],
          [0, 0, 255],
        ],
      },
    ];
    const factionColour = [
      [210, 50, 44],
      [51, 151, 197],
    ];
    for (const faction of factions) {
      for (let humans = 1; humans <= 6; humans++) {
        const alone = colours.resolvePlayerColorPairs(
          humans,
          faction,
          factionColour
        );
        const withAis = colours.resolvePlayerColorPairs(
          humans + 6,
          faction,
          factionColour
        );
        assert.deepEqual(withAis.slice(0, humans), alone);
        assert.deepEqual(
          roster.colourPairs({
            resolve: colours.resolvePlayerColorPairs,
            humanArmies: humans,
            aiCount: 6,
            faction: faction,
            factionColour: factionColour,
          }),
          withAis.slice(humans)
        );
      }
    }
  });
});

describe("humanCapacity / roomForSlot", () => {
  it("leaves the AIs' slots out of an open lobby's limit", () => {
    assert.equal(roster.humanCapacity(12, false, 3), 9);
    assert.equal(roster.roomForSlot(8, 12, false, 3), true);
    assert.equal(roster.roomForSlot(9, 12, false, 3), false);
  });

  // A lock's limit comes from the wrapped savedCoopPlayers, which already
  // counts the AIs out.
  it("takes a lock's limit as it is", () => {
    assert.equal(roster.humanCapacity(2, true, 2), 2);
    assert.equal(roster.roomForSlot(1, 2, true, 2), true);
    assert.equal(roster.roomForSlot(2, 2, true, 2), false);
  });

  it("falls back to stock's limit of 12 before the server reports one", () => {
    assert.equal(roster.humanCapacity(NaN, false, 2), 10);
    assert.equal(roster.humanCapacity(0, false, 0), 12);
  });
});

describe("slotRows", () => {
  const STOCK_FIELDS = [
    "index",
    "id",
    "name",
    "host",
    "loading",
    "loadingStatus",
    "loadingTooltip",
    "empty",
    "showInventory",
    "inventoryAvailable",
    "inventoryTooltip",
    "canRemove",
    "canKick",
  ];

  it("gives each AI a row with every field a stock row carries", () => {
    const rows = roster.slotRows(
      [aiRecord(1), aiRecord(2)],
      3,
      "!LOC:Loading into lobby"
    );

    assert.equal(rows.length, 2);
    for (const field of STOCK_FIELDS) {
      assert.ok(field in rows[0], field);
    }
    assert.deepEqual(
      rows.map((row) => [row.index, row.id, row.name]),
      [
        [3, "gwo_ai_1", "AI1"],
        [4, "gwo_ai_2", "AI2"],
      ]
    );
    assert.equal(rows[0].gwoAi, true);
    assert.equal(rows[0].empty, false);
    assert.equal(rows[0].host, false);
    // Stock's own Kick and "-" never act on an AI row.
    assert.equal(rows[0].canKick, false);
    assert.equal(rows[0].canRemove, false);
    assert.equal(rows[0].loadingTooltip, "!LOC:Loading into lobby");
  });
});

describe("parseAiNames", () => {
  it("reads every quoted string once, in order", () => {
    const text = [
      "exports.data =",
      "[",
      "'Sorian',",
      '"Double",',
      "'Chunk',",
      "'O\\'Neil',",
      "'Chunk',",
      "'  ',",
      "];",
    ].join("\n");

    assert.deepEqual(roster.parseAiNames(text), [
      "Sorian",
      "Double",
      "Chunk",
      "O'Neil",
    ]);
  });

  it("reads nothing from nothing", () => {
    assert.deepEqual(roster.parseAiNames(undefined), []);
    assert.deepEqual(roster.parseAiNames("exports.data = [];"), []);
  });

  it("reads the stock skirmish list (skipped without a PA install)", (t) => {
    const source = stockFile("server-script/ai_names_table.js");
    if (!source) {
      t.skip("no PA install");
      return;
    }

    const names = roster.parseAiNames(source);
    assert.ok(names.length > 150, `only ${names.length} names`);
    assert.equal(new Set(names).size, names.length);
    assert.ok(names.includes("Sorian"));
  });
});

describe("pickAiName", () => {
  const NAMES = ["Sorian", "Quitch", "Garat", "Krater"];

  it("never draws a name a player or another AI already has, whatever the case", () => {
    const taken = ["quitch", "SORIAN", "Garat"];
    for (let seed = 0; seed < 20; seed++) {
      assert.equal(
        roster.pickAiName(NAMES, taken, gwoRng.create("s" + seed)),
        "Krater"
      );
    }
  });

  it("draws the same name from the same stream", () => {
    assert.equal(
      roster.pickAiName(NAMES, [], gwoRng.create("a")),
      roster.pickAiName(NAMES, [], gwoRng.create("a"))
    );
  });

  it("draws nothing once every name is taken", () => {
    assert.equal(
      roster.pickAiName(NAMES, NAMES, gwoRng.create("a")),
      undefined
    );
    assert.equal(roster.pickAiName([], [], undefined), undefined);
  });

  it("draws unseeded without a stream", () => {
    assert.ok(NAMES.includes(roster.pickAiName(NAMES, [], undefined)));
  });
});

describe("pickAiCommander", () => {
  const OWNED = ["a.json", "b.json", "c.json"];

  it("draws from the host's owned commanders, less those fielded", () => {
    for (let seed = 0; seed < 10; seed++) {
      assert.equal(
        roster.pickAiCommander({
          owned: OWNED,
          fielded: ["a.json", "c.json"],
          fallback: "host.json",
          rng: gwoRng.create("c" + seed),
        }),
        "b.json"
      );
    }
  });

  it("draws a race AI from the race's own commanders", () => {
    assert.equal(
      roster.pickAiCommander({
        raceCommanders: ["legion.json"],
        owned: OWNED,
        fielded: [],
        fallback: "host.json",
        rng: gwoRng.create("x"),
      }),
      "legion.json"
    );
  });

  it("takes the host's commander when every candidate is fielded", () => {
    assert.equal(
      roster.pickAiCommander({
        owned: OWNED,
        fielded: OWNED,
        fallback: "host.json",
      }),
      "host.json"
    );
    assert.equal(
      roster.pickAiCommander({ fallback: "host.json" }),
      "host.json"
    );
  });
});

describe("buildAiRecord", () => {
  afterEach(() => races.reset());

  function build(options) {
    const opts = options || {};
    const fixture = buildGame({
      aiInUse: "Titans",
      aiCoopInUse: opts.brain || "Titans",
    });
    installModel(fixture.game);
    return roster.buildAiRecord({
      identity: { serial: 2, playerId: "gwo_ai_2" },
      rng: opts.rng === null ? undefined : gwoRng.create("war").stream("ai", 2),
      race: opts.race || "mla",
      names: opts.names || ["Sorian", "Garat"],
      taken: opts.taken || ["Garat"],
      owned: [COMMANDER, "other.json"],
      fielded: ["other.json"],
      hostCommander: "host.json",
      now: 42,
    });
  }

  it("writes an AI with no playerName and no inventory", () => {
    const record = build();

    assert.deepEqual(record, {
      playerId: "gwo_ai_2",
      commander: COMMANDER,
      updatedAt: 42,
      gwaioAi: {
        serial: 2,
        name: "Sorian",
        personalityId: "absurd",
        createdAt: 42,
      },
    });
    assert.equal(roster.isAiRecord(record), true);
  });

  it("gives a Queller AI the uber template", () => {
    assert.equal(build({ brain: "Queller" }).gwaioAi.personalityId, "uber");
  });

  it("draws a Penchant AI one penchant, the same from the same stream", () => {
    const first = build({ brain: "Penchant" }).gwaioAi;
    const again = build({ brain: "Penchant" }).gwaioAi;

    assert.equal(typeof first.penchantName, "string");
    assert.equal(first.penchantName, again.penchantName);
    assert.equal(first.personalityId, "absurd");
  });

  it("names the AI by its serial when no name is free", () => {
    assert.equal(build({ names: ["Garat"] }).gwaioAi.name, "AI 2");
  });

  it("draws unseeded in a war without a seed", () => {
    assert.equal(build({ rng: null }).gwaioAi.name, "Sorian");
  });

  it("gives a race AI one of the race's commanders", () => {
    races.register(
      Object.assign({}, FIXTURE_RACE, {
        commanders: [{ spec: "/pa/units/fixture_commander.json" }],
      })
    );
    assert.equal(
      build({ race: "fixture" }).commander,
      "/pa/units/fixture_commander.json"
    );
  });
});

describe("launchAis", () => {
  function launch(overrides) {
    const fixture = buildGame({
      aiInUse: "Titans",
      aiCoopInUse: "Queller",
    });
    installModel(fixture.game);
    return roster.launchAis(
      Object.assign(
        {
          records: [
            aiRecord(2, { commander: "b.json" }),
            { playerId: "uber-1", playerName: "Alice" },
            aiRecord(1, {
              gwaioAi: {
                serial: 1,
                name: "Sorian",
                personalityId: "uber",
                penchantName: "!LOC:Artillery",
              },
            }),
          ],
          active: true,
          perPlayerTech: false,
          humanCount: 2,
          hostRace: "mla",
          hostInventory: fixture.inventory,
          colours: (count) =>
            Array.from({ length: count }, (unused, index) => "pair" + index),
        },
        overrides
      )
    );
  }

  it("fields nobody outside an active session", () => {
    assert.deepEqual(launch({ active: false }), []);
  });

  it("fields nobody under per-player tech yet", () => {
    assert.deepEqual(launch({ perPlayerTech: true }), []);
  });

  it("fields every AI in slot order, on one shared tree under shared tech", () => {
    const ais = launch();

    assert.deepEqual(
      ais.map((ai) => [ai.id, ai.slot, ai.colour, ai.commander]),
      [
        ["gwo_ai_1", 0, "pair0", COMMANDER],
        ["gwo_ai_2", 1, "pair1", "b.json"],
      ]
    );
    for (const ai of ais) {
      assert.equal(ai.tag, ".player");
      assert.equal(ai.scopeToken, "coopai");
      assert.equal(ai.race, "mla");
      assert.equal(ai.brain, "Queller");
      assert.equal(ai.source, "/pa/ai_queller/q_uber/");
      assert.equal(ai.path, "/pa/ai_queller/q_uber/player_coopai/");
    }
    assert.equal(ais[0].character, "!LOC:Uber");
    assert.equal(ais[0].penchantName, "!LOC:Artillery");
    assert.equal(ais[1].character, "!LOC:Absurd");
  });

  it("hands each AI the host's inventory under shared tech", () => {
    const fixture = buildGame({});
    const ais = launch({ hostInventory: fixture.inventory });
    assert.equal(ais[0].inventory, fixture.inventory);
  });
});

describe("panelEntries", () => {
  it("lists each AI's name, colour and race", () => {
    assert.deepEqual(
      roster.panelEntries([
        { name: "Sorian", colour: "pair0", race: "mla" },
        { name: "Garat", colour: "pair1", race: undefined },
      ]),
      [
        { name: "Sorian", colour: "pair0", race: "mla" },
        { name: "Garat", colour: "pair1", race: "mla" },
      ]
    );
  });
});
