"use strict";

// shared/starting_inventory.js: a co-op player's starting inventory, built from
// their loadout. The per-player loadout scene builds a viewer's with it, and the
// host a co-op AI player's.

const { describe, it, mock } = require("node:test");
const assert = require("node:assert/strict");

const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const {
  createGlobalStubs,
  trackActive,
} = require("../scripts/lib/global-stubs.js");
const {
  installFakeJQuery,
  rejected,
  resolved,
} = require("../scripts/lib/fake-jquery.js");

const startingInventory = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/starting_inventory.js"
);

// A GWInventory whose applyCards runs `buff` over the loaded cards.
function inventoryClass(buff, created) {
  return function GWInventory() {
    const state = { cards: [], tags: {}, maxCards: 0 };
    this.load = (config) => {
      state.cards = config.cards;
      state.tags = config.tags;
    };
    this.setTag = (context, name, value) => {
      state.tags[context] = state.tags[context] || {};
      state.tags[context][name] = value;
    };
    this.applyCards = (done) => {
      buff(state);
      done();
    };
    this.save = () => JSON.parse(JSON.stringify(state));
    if (created) {
      created.push(state);
    }
  };
}

const active = trackActive(() => {
  const stubs = createGlobalStubs();
  installFakeJQuery(stubs);
  const errorMock = mock.method(console, "error", () => {});
  return {
    errors: errorMock.mock,
    restore: () => {
      errorMock.mock.restore();
      stubs.restoreGlobals();
    },
  };
});

describe("validateStartingInventory", () => {
  it("takes the loadout alone in first place with room beyond it", () => {
    active.build();
    assert.equal(
      startingInventory.validateStartingInventory(
        { cards: [{ id: "gwc_start_air" }], maxCards: 3 },
        "gwc_start_air"
      ),
      true
    );
  });

  const REFUSED = {
    "no cards": { cards: [], maxCards: 3 },
    "another card first": { cards: [{ id: "gwc_minion" }], maxCards: 3 },
    "no room": { cards: [{ id: "gwc_start_air" }], maxCards: 1 },
    "no card count": { cards: [{ id: "gwc_start_air" }] },
  };
  for (const [reason, saved] of Object.entries(REFUSED)) {
    it(`refuses ${reason}, and says so`, () => {
      const run = active.build();
      assert.equal(
        startingInventory.validateStartingInventory(saved, "gwc_start_air"),
        false
      );
      assert.equal(run.errors.callCount(), 1);
    });
  }
});

describe("buildGlobalTags", () => {
  it("carries the commander, and the faction and race when known", () => {
    assert.deepEqual(startingInventory.buildGlobalTags("c.json", 2, "legion"), {
      commander: "c.json",
      playerFaction: 2,
      playerRace: "legion",
    });
    assert.deepEqual(
      startingInventory.buildGlobalTags("c.json", undefined, ""),
      { commander: "c.json" }
    );
  });
});

describe("build", () => {
  function params(overrides) {
    return Object.assign(
      {
        GWInventory: inventoryClass((state) => {
          state.maxCards = 3;
        }),
        gwoDeal: {
          dealCard: (dealParams) =>
            resolved({ id: dealParams.id, dealt: true }),
        },
        loaded: resolved(),
        loadedCards: [],
        loadoutCardId: "gwc_start_air",
        commander: "c.json",
        playerFaction: 1,
        playerRace: "mla",
        galaxy: {},
        star: {},
      },
      overrides
    );
  }

  it("deals the loadout on an inventory tagged as the player, then applies it", async () => {
    active.build();
    const dealt = [];
    const created = [];
    const saved = await startingInventory.build(
      params({
        GWInventory: inventoryClass((state) => {
          state.maxCards = 3;
        }, created),
        gwoDeal: {
          dealCard: (dealParams) => {
            dealt.push(dealParams);
            return resolved({ id: dealParams.id, dealt: true });
          },
        },
      })
    );

    assert.equal(dealt.length, 1);
    assert.equal(dealt[0].id, "gwc_start_air");
    assert.deepEqual(created[0].tags, {
      global: { commander: "c.json", playerFaction: 1, playerRace: "mla" },
    });
    assert.deepEqual(saved.cards, [{ id: "gwc_start_air", dealt: true }]);
    assert.equal(saved.maxCards, 3);
    assert.deepEqual(saved.tags.global.commander, "c.json");
  });

  it("rejects a loadout that leaves no room", async () => {
    active.build();
    await assert.rejects(
      startingInventory.build(
        params({
          GWInventory: inventoryClass((state) => {
            state.maxCards = 1;
          }),
        })
      ),
      (reason) => /empty tech banks/.test(reason)
    );
  });

  it("rejects when the loadout cannot be dealt", async () => {
    active.build();
    await assert.rejects(
      startingInventory.build(
        params({
          gwoDeal: { dealCard: () => rejected(new Error("not found")) },
        })
      ),
      /not found/
    );
  });
});
