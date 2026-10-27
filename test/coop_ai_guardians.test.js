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
const coopAiCards = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/coop_ai_cards.js"
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

  // Their units are the same, all reached, either side of a card.
  it("scores as the full scorer does, without its unit sums", () => {
    const view = guardians.view(["/u/bot", "/u/bot_factory", "/u/tank"]);
    const mod = (file, value) => ({
      file,
      path: "max_health",
      op: "multiply",
      value,
    });
    const cases = [
      [[mod("/u/bot", 1.5)], {}],
      [[mod("/u/tank", 0.5), mod(BASE_COMMANDER, 1.2)], {}],
      [[], { aiMods: [{ op: "append" }], units: ["/u/tank"] }],
    ];
    for (const [mods, extra] of cases) {
      const without = inventory();
      const withCard = inventory(
        mods,
        Object.assign({ cards: [{}, { id: "card" }] }, extra)
      );
      const context = (fixedUnits) => ({
        lookup: LOOKUP,
        commander: UNICORN,
        teamDomains: [],
        memo: {},
        fielded: fixedUnits
          ? view
          : Object.assign({}, view, { fixedUnits: false }),
        namesUnits: true,
        chance: 0,
      });
      const full = coopAiCards.scoreCard(without, withCard, context(false));
      assert.deepEqual(
        coopAiCards.scoreCard(without, withCard, context(true)),
        full
      );
      assert.equal(guardians.gain(view, without, withCard, LOOKUP), full.total);
    }
  });

  it("keeps one memo for every card it judges, and another for every copy", () => {
    const view = guardians.view(["/u/bot"], undefined, { mods: [] });
    const buff = { file: "/u/bot", path: "max_health", op: "multiply" };
    const withCard = inventory([Object.assign({ value: 1.5 }, buff)]);
    guardians.gain(view, inventory(), withCard, LOOKUP);
    guardians.gain(view, inventory(), withCard, LOOKUP);

    assert.equal(view.fixedUnits, true);
    assert.ok(view.memo.keyed.length > 0);
    assert.notEqual(view.everyCopy.memo, view.memo);
  });

  it("reaches every unit it is handed", () => {
    assert.equal(VIEW.reachable(["/u/bot"], UNICORN, []).length, 1);
    assert.deepEqual(VIEW.obtainable, []);
  });
});

describe("coop_ai_guardians.held", () => {
  const mod = (op, value) => ({
    file: "/u/bot",
    path: "max_health",
    op,
    value: value === undefined ? 2 : value,
  });

  it("drops a copy the humans give already of each op that does not stack", () => {
    guardians.NON_STACKING.forEach((op) => {
      assert.deepEqual(
        guardians.held([mod(op)], [mod(op)], guardians.NON_STACKING),
        [],
        op
      );
    });
  });

  it("keeps a copy of each op that stacks, or that may not be idempotent", () => {
    ["multiply", "add", "push", "prepend", "multiplyOrCreate", "wipe", "eval"]
      .map((op) => [mod(op)])
      .forEach((mods) => {
        assert.equal(
          guardians.held(mods, mods.slice(), guardians.NON_STACKING),
          mods
        );
      });
  });

  it("keeps a mod the humans give only with another value, file or path", () => {
    const mods = [mod("replace", 3)];

    assert.equal(
      guardians.held(
        mods,
        [
          mod("replace"),
          Object.assign(mod("replace", 3), { file: "/u/tank" }),
          Object.assign(mod("replace", 3), { path: "max_speed" }),
        ],
        guardians.NON_STACKING
      ),
      mods
    );
  });

  it("drops every copy of a held mod, and keeps the rest in order", () => {
    const kept = mod("multiply");

    assert.deepEqual(
      guardians.held(
        [mod("replace"), kept, mod("replace")],
        [mod("replace")],
        guardians.NON_STACKING
      ),
      [kept]
    );
  });

  it("drops a held AI mod whose op is idempotent, and keeps one that duplicates", () => {
    const aiMod = (op) => ({ type: "factory", op, toBuild: "Bot", value: 1 });

    guardians.NON_STACKING_AI.forEach((op) => {
      assert.deepEqual(
        guardians.held([aiMod(op)], [aiMod(op)], guardians.NON_STACKING_AI),
        [],
        op
      );
    });
    ["append", "prepend", "new", "squad"].forEach((op) => {
      assert.equal(
        guardians.held([aiMod(op)], [aiMod(op)], guardians.NON_STACKING_AI)
          .length,
        1,
        op
      );
    });
  });

  it("reads missing lists as empty", () => {
    assert.equal(guardians.held(undefined, undefined, []), undefined);
    assert.deepEqual(guardians.held([undefined], [], ["replace"]), [undefined]);
  });
});

describe("coop_ai_guardians.view with the humans' mods", () => {
  const reshape = {
    file: "/u/bot",
    path: "max_health",
    op: "replace",
    value: 500,
  };
  const armour = { file: "/u/bot", path: "max_health", op: "multiply" };
  const human = {
    mods: [reshape, Object.assign({ value: 1.5 }, armour)],
    aiMods: [{ op: "replace", toBuild: "Bot" }],
  };
  const view = guardians.view(LOOKUP.obtainable, undefined, human);

  it("gives the Guardians nothing for a copy the humans give already", () => {
    assert.equal(gainOf([reshape], {}, view), 0);
    assert.equal(
      gainOf([], { aiMods: [{ op: "replace", toBuild: "Bot" }] }, view),
      0
    );
  });

  it("still counts a copy that stacks on the humans'", () => {
    assert.ok(gainOf([Object.assign({ value: 1.5 }, armour)], {}, view) > 0);
    assert.ok(gainOf([], { aiMods: [{ op: "append" }] }, view) > 0);
  });

  it("still counts every copy in everyCopy, which is the view itself without humans", () => {
    assert.ok(gainOf([reshape], {}, view.everyCopy) > 0);
    assert.equal(view.everyCopy.everyCopy, view.everyCopy);
    assert.equal(VIEW.everyCopy, VIEW);
  });

  it("compares the mods before the host race lands them, and lands each copy once", () => {
    const seen = [];
    const raceView = {
      inventory: (saved) => {
        seen.push(saved);
        return {
          mods: saved.mods.map((mod) =>
            Object.assign({}, mod, { file: "/race" + mod.file })
          ),
          aiMods: saved.aiMods,
        };
      },
    };
    const raced = guardians.view(["/u/tank"], raceView, human);
    const applied = inventory([reshape, Object.assign({ value: 2 }, armour)], {
      aiMods: [{ op: "replace", toBuild: "Bot" }, { op: "append" }],
    });

    const first = raced.inventory(applied);
    const again = raced.inventory(applied);

    assert.deepEqual(first.mods, [
      Object.assign({ value: 2 }, armour, { file: "/race/u/bot" }),
    ]);
    assert.deepEqual(first.aiMods, [{ op: "append" }]);
    assert.deepEqual(again, first);
    assert.equal(seen[0], applied);
    assert.deepEqual(seen[1].mods, [Object.assign({ value: 2 }, armour)]);
    assert.equal(seen[3], seen[1]);
  });

  it("keeps no more than 16 inventories' copies", () => {
    const landed = [];
    const raced = guardians.view(
      [],
      {
        inventory: (saved) => {
          landed.push(saved);
          return saved;
        },
      },
      human
    );
    const first = inventory([reshape]);
    const copyOf = (saved) => {
      raced.inventory(saved);
      return landed[landed.length - 1];
    };

    const copy = copyOf(first);
    for (let i = 0; i < 15; i += 1) {
      copyOf(inventory([reshape]));
    }
    assert.equal(copyOf(first), copy);
    copyOf(inventory([reshape]));

    assert.notEqual(copyOf(first), copy);
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

  it("logs a card the humans' copies leave worth nothing to the Guardians", () => {
    assert.equal(
      guardians.describePrune(
        Object.assign({}, base, {
          judged: [{ id: "bot_reshape", worth: 1.5, gain: 0, humanHeld: true }],
          deleted: [],
          refused: [],
        })
      ),
      "[GW COOP AI] Sorian prune deal=4 via=fielded threshold=7 held: " +
        "bot_reshape=1.5 (guardians 0, human-held) -> kept all"
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
