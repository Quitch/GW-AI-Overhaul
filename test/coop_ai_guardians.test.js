"use strict";

// shared/coop_ai_guardians.js: when The Guardians are the last boss, and what
// a co-op AI player's held card is worth to them. The scoring itself is
// pinned in coop_ai_cards.test.js; this pins the Guardians' view of it. See
// coop.md, "Before The Guardians".

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  loadCouiModule,
  installGlobals,
} = require("../scripts/lib/amd-loader.js");

installGlobals();

const guardians = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/coop_ai_guardians.js"
);

const UNICORN = guardians.COMMANDER;
const BASE_COMMANDER =
  "/pa/units/commanders/base_commander/base_commander.json";

const CELLS = {
  "/u/bot": ["Bot", "Basic", "Combat"],
  "/u/bot_factory": ["Bot", "Basic", "Factory"],
  "/u/tank": ["Vehicle", "Basic", "Combat"],
  [UNICORN]: ["Land", "Basic", "Commander"],
};

const LOOKUP = {
  via: "specs",
  classOf: (unit) => {
    const cell = CELLS[unit];
    return (
      cell && {
        domain: cell[0],
        tier: cell[1],
        cls: cell[2],
        key: cell.join("/"),
      }
    );
  },
  ownersOf: (file) => [file],
  ownedBy: (file, unit) =>
    file === unit || (file === BASE_COMMANDER && unit === UNICORN),
  reachable: () => [],
  obtainable: ["/u/bot", "/u/bot_factory", "/u/tank"],
};

const VIEW = guardians.view(LOOKUP.obtainable);

const inventory = (mods, extra) =>
  Object.assign(
    {
      cards: [{ id: "gwc_start_bot" }],
      units: ["/u/bot_factory"],
      mods: mods || [],
      aiMods: [],
      minions: [],
      maxCards: 3,
    },
    extra
  );

const gainOf = (mods, extra, view) =>
  guardians.gain(
    view || VIEW,
    inventory(),
    inventory(mods, Object.assign({ cards: [{}, { id: "card" }] }, extra)),
    LOOKUP
  );

describe("coop_ai_guardians.last", () => {
  const theGuardians = { boss: true, mirrorMode: true };
  const boss = { boss: true, team: 0 };
  const worker = { team: 0 };

  it("is true once every faction boss is gone and The Guardians stand", () => {
    assert.equal(guardians.last([theGuardians, undefined, worker]), true);
  });

  it("is false while a faction boss stands", () => {
    assert.equal(guardians.last([theGuardians, boss]), false);
  });

  it("is false once The Guardians are gone", () => {
    assert.equal(guardians.last([undefined, worker]), false);
    assert.equal(guardians.last([]), false);
  });
});

describe("coop_ai_guardians.gain", () => {
  it("counts a stat buff for them", () => {
    const buff = { file: "/u/bot", path: "max_health", op: "multiply" };
    assert.ok(gainOf([Object.assign({ value: 1.5 }, buff)]) > 0);
  });

  it("counts a cost increase against them", () => {
    const cost = { file: "/u/bot", path: "build_metal_cost", op: "multiply" };
    assert.ok(gainOf([Object.assign({ value: 1.5 }, cost)]) < 0);
  });

  it("counts AI mods for them", () => {
    assert.ok(gainOf([], { aiMods: [{ op: "append" }] }) > 0);
  });

  it("counts a card that only grants units as nothing", () => {
    assert.equal(gainOf([], { units: ["/u/bot_factory", "/u/tank"] }), 0);
  });

  it("counts a base_commander buff for their Unicorn", () => {
    const mod = {
      file: BASE_COMMANDER,
      path: "max_health",
      op: "multiply",
      value: 1.2,
    };
    assert.ok(gainOf([mod]) > 0);
  });

  it("lands the mods and AI mods through the host race's view", () => {
    const seen = [];
    const raceView = {
      inventory: (applied) => {
        seen.push(applied);
        return {
          mods: applied.mods.length
            ? [
                {
                  file: "/u/tank",
                  path: "max_health",
                  op: "multiply",
                  value: 2,
                },
              ]
            : [],
          aiMods: [],
        };
      },
    };
    const view = guardians.view(["/u/tank"], raceView);
    const nerf = { file: "/u/bot", path: "max_health", op: "multiply" };

    assert.ok(gainOf([Object.assign({ value: 0.5 }, nerf)], {}, view) > 0);
    assert.equal(seen.length, 2);
    assert.deepEqual(view.inventory(inventory()).units, ["/u/tank"]);
  });

  it("reaches every unit it is handed", () => {
    assert.equal(VIEW.reachable(["/u/bot"], UNICORN, []).length, 1);
    assert.deepEqual(VIEW.obtainable, []);
  });
});

describe("coop_ai_guardians.describePrune", () => {
  const base = {
    name: "Sorian",
    deal: 4,
    via: "fielded",
    threshold: 7,
    judged: [
      { id: "bot_armour", worth: 2.5, gain: 3 },
      { id: "air", worth: 12, gain: 0 },
    ],
  };

  it("logs each held card, and what the AI deleted", () => {
    assert.equal(
      guardians.describePrune(
        Object.assign({ deleted: ["bot_armour"], refused: [] }, base)
      ),
      "[GW COOP AI] Sorian prune deal=4 via=fielded threshold=7 held: " +
        "bot_armour=2.5 (guardians 3), air=12 (guardians 0) -> deleted bot_armour"
    );
  });

  it("logs a card kept to keep a land factory", () => {
    assert.equal(
      guardians.describePrune(
        Object.assign(
          {
            deleted: [],
            refused: [{ id: "bot_armour", why: "landFactory" }],
          },
          base
        )
      ),
      "[GW COOP AI] Sorian prune deal=4 via=fielded threshold=7 held: " +
        "bot_armour=2.5 (guardians 3), air=12 (guardians 0) -> kept all " +
        "kept bot_armour (landFactory)"
    );
  });

  it("logs an AI with nothing to judge", () => {
    assert.equal(
      guardians.describePrune(
        Object.assign({}, base, { judged: [], deleted: [], refused: [] })
      ),
      "[GW COOP AI] Sorian prune deal=4 via=fielded threshold=7 held: none -> kept all"
    );
  });
});
