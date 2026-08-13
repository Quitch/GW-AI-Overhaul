"use strict";

// Tests for gw_play/gwo_streams.js, which holds every stream key the play scene
// draws from. The collision suite is the point of the file: a key that shadows
// another would silently make two unrelated deals identical.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const streams = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/gwo_streams.js"
);

const SEED = { seed: "a-war-seed" };

function draws(rng, count = 4) {
  return Array.from({ length: count }, () => rng());
}

describe("warRng", () => {
  it("returns an rng for a seeded war", () => {
    assert.equal(typeof streams.warRng(SEED), "function");
  });

  // The lobby's own default seed is a number, and 0 must not read as absent.
  it("treats a numeric zero seed as a real seed", () => {
    assert.equal(typeof streams.warRng({ seed: 0 }), "function");
  });

  it("returns undefined for a war saved before seeds were recorded", () => {
    assert.equal(streams.warRng(undefined), undefined);
    assert.equal(streams.warRng({}), undefined);
    assert.equal(streams.warRng({ seed: "" }), undefined);
    assert.equal(streams.warRng({ seed: null }), undefined);
  });

  it("gives different wars different streams", () => {
    assert.notDeepEqual(
      draws(streams.warRng({ seed: "one" })),
      draws(streams.warRng({ seed: "two" }))
    );
  });
});

describe("coopPlayerKey", () => {
  it("prefers the record's playerId, which survives a reconnect", () => {
    assert.equal(
      streams.coopPlayerKey({ playerId: "uber-1" }, { id: 7, name: "Bob" }),
      "uber-1"
    );
  });

  it("falls back to the client id, then the client name", () => {
    assert.equal(streams.coopPlayerKey({}, { id: 7, name: "Bob" }), "7");
    assert.equal(streams.coopPlayerKey({}, { name: "Bob" }), "Bob");
  });

  it("falls back to a constant when nothing identifies the player", () => {
    assert.equal(streams.coopPlayerKey(undefined, undefined), "unknown");
  });

  // A space in a label would let stream("a b") collide with stream("a", "b").
  it("squashes whitespace in a player name", () => {
    assert.equal(
      streams.coopPlayerKey({}, { name: "Big Bad Bob" }),
      "Big_Bad_Bob"
    );
  });
});

describe("gwo_streams fallback contract", () => {
  // Every call site relies on this: no seed means keep drawing unseeded.
  it("propagates an absent warRng through every builder", () => {
    assert.equal(streams.generalCommanderRng(undefined, "host"), undefined);
    assert.equal(streams.exploreDealRng(undefined, 1, 2, 0), undefined);
    assert.equal(streams.aiStarDealRng(undefined, 1, 2), undefined);
    assert.equal(streams.coopDealRng(undefined, "p", 1), undefined);
    assert.equal(streams.coopStarDealRng(undefined, "p", 1, 2), undefined);
    assert.equal(streams.treasureLoadoutRng(undefined, "p", 1), undefined);
    assert.equal(streams.coopRerollRng(undefined, "p", 1, 0), undefined);
    assert.equal(streams.battleRng(undefined, 1, 2), undefined);
    assert.equal(streams.iterationRng(undefined, 0), undefined);
    assert.equal(streams.cardRng(undefined, "gwc_minion"), undefined);
    assert.equal(streams.conquestMoveRng(undefined, 0, 2), undefined);
    assert.equal(streams.conquestModesRng(undefined, 1, 2), undefined);
    assert.equal(streams.conquestGarrisonRng(undefined, 1, 2), undefined);
    assert.equal(streams.conquestFoeRng(undefined, 1, 2), undefined);
    assert.equal(streams.conquestAllyRng(undefined, 1, 2), undefined);
    assert.equal(streams.conquestScaleRng(undefined, 1, 0), undefined);
    assert.equal(streams.conquestBossScaleRng(undefined, 0, 1), undefined);
  });
});

describe("gwo_streams determinism", () => {
  it("reproduces every stream from the same seed and arguments", () => {
    const build = () => {
      const war = streams.warRng(SEED);
      return {
        gc: draws(streams.generalCommanderRng(war, "host")),
        explore: draws(streams.exploreDealRng(war, 3, 5, 1)),
        ai: draws(streams.aiStarDealRng(war, 3, 5)),
        coop: draws(streams.coopDealRng(war, "uber-1", 2)),
        coopStar: draws(streams.coopStarDealRng(war, "uber-1", 3, 5)),
        treasure: draws(streams.treasureLoadoutRng(war, "uber-1", 3)),
        battle: draws(streams.battleRng(war, 3, 5)),
        conquestMove: draws(streams.conquestMoveRng(war, 1, 5)),
        conquestModes: draws(streams.conquestModesRng(war, 3, 5)),
        conquestGarrison: draws(streams.conquestGarrisonRng(war, 3, 5)),
        conquestFoe: draws(streams.conquestFoeRng(war, 3, 5)),
        conquestAlly: draws(streams.conquestAllyRng(war, 3, 5)),
        conquestScale: draws(streams.conquestScaleRng(war, 3, 2)),
        conquestBoss: draws(streams.conquestBossScaleRng(war, 1, 4)),
      };
    };
    assert.deepEqual(build(), build());
  });

  it("gives each argument real influence", () => {
    const war = streams.warRng(SEED);
    assert.notDeepEqual(
      draws(streams.exploreDealRng(war, 3, 5, 0)),
      draws(streams.exploreDealRng(war, 4, 5, 0))
    );
    assert.notDeepEqual(
      draws(streams.exploreDealRng(war, 3, 5, 0)),
      draws(streams.exploreDealRng(war, 3, 6, 0))
    );
    assert.notDeepEqual(
      draws(streams.exploreDealRng(war, 3, 5, 0)),
      draws(streams.exploreDealRng(war, 3, 5, 1))
    );
    assert.notDeepEqual(
      draws(streams.aiStarDealRng(war, 3, 5)),
      draws(streams.aiStarDealRng(war, 3, 6))
    );
    assert.notDeepEqual(
      draws(streams.battleRng(war, 3, 5)),
      draws(streams.battleRng(war, 3, 6))
    );
    assert.notDeepEqual(
      draws(streams.coopStarDealRng(war, "p", 3, 5)),
      draws(streams.coopStarDealRng(war, "q", 3, 5))
    );
    assert.notDeepEqual(
      draws(streams.coopStarDealRng(war, "p", 3, 5)),
      draws(streams.coopStarDealRng(war, "p", 3, 6))
    );
    assert.notDeepEqual(
      draws(streams.treasureLoadoutRng(war, "p", 3)),
      draws(streams.treasureLoadoutRng(war, "q", 3))
    );
    assert.notDeepEqual(
      draws(streams.treasureLoadoutRng(war, "p", 3)),
      draws(streams.treasureLoadoutRng(war, "p", 4))
    );
  });

  // The absence of a turn component is what makes a treasure offer survive
  // re-exploration and a catch-up deal replaying an old star.
  it("keys a treasure loadout on the player and star alone", () => {
    const war = streams.warRng(SEED);
    assert.deepEqual(
      draws(streams.treasureLoadoutRng(war, "p", 3)),
      draws(streams.treasureLoadoutRng(war, "p", 3))
    );
  });

  // The host has no playerKey of its own, and must not land on the key an
  // unidentifiable viewer falls back to.
  it("defaults a treasure loadout to the host key", () => {
    const war = streams.warRng(SEED);
    assert.deepEqual(
      draws(streams.treasureLoadoutRng(war, undefined, 3)),
      draws(streams.treasureLoadoutRng(war, "host", 3))
    );
    assert.notDeepEqual(
      draws(streams.treasureLoadoutRng(war, undefined, 3)),
      draws(streams.treasureLoadoutRng(war, "unknown", 3))
    );
  });

  it("keeps a bare deal apart from its own reroll and iterations", () => {
    const war = streams.warRng(SEED);
    const deal = streams.coopDealRng(war, "p", 1);
    assert.notDeepEqual(
      draws(deal),
      draws(streams.coopRerollRng(war, "p", 1, 0))
    );
    assert.notDeepEqual(
      draws(streams.coopDealRng(war, "p", 1)),
      draws(streams.iterationRng(streams.coopDealRng(war, "p", 1), 0))
    );
  });

  // An undefined dealIndex must not degrade stream("deal", undefined) into
  // stream("deal"), which would collide with the parent.
  it("does not let a missing index collide with a present one", () => {
    const war = streams.warRng(SEED);
    assert.notDeepEqual(
      draws(streams.coopDealRng(war, "p", undefined)),
      draws(streams.coopDealRng(war, "p", 0))
    );
    assert.notDeepEqual(
      draws(streams.iterationRng(streams.coopDealRng(war, "p", 1), undefined)),
      draws(streams.iterationRng(streams.coopDealRng(war, "p", 1), 0))
    );
  });
});

describe("gwo_streams key collisions", () => {
  // One grid over every builder and a spread of arguments. Any future key that
  // shadows another shows up here rather than as two identical deals in a war.
  it("gives every distinct key a distinct sequence", () => {
    const war = streams.warRng(SEED);
    const built = [];

    const add = (label, rng) =>
      built.push({ label, seq: draws(rng, 3).join() });

    for (const player of ["host", "uber-1", "uber 1", "0"]) {
      add(`gc:${player}`, streams.generalCommanderRng(war, player));
      for (const star of [0, 1, 2]) {
        add(
          `treasure:${player}:${star}`,
          streams.treasureLoadoutRng(war, player, star)
        );
        for (const turns of [0, 1, 2]) {
          add(
            `coopStar:${player}:${star}:${turns}`,
            streams.coopStarDealRng(war, player, star, turns)
          );
        }
      }
      for (const dealIndex of [-1, 0, 1, 2]) {
        add(
          `coop:${player}:${dealIndex}`,
          streams.coopDealRng(war, player, dealIndex)
        );
        for (const reroll of [0, 1]) {
          add(
            `coopReroll:${player}:${dealIndex}:${reroll}`,
            streams.coopRerollRng(war, player, dealIndex, reroll)
          );
        }
      }
    }

    for (const star of [0, 1, 2]) {
      for (const turns of [0, 1, 2]) {
        add(`ai:${star}:${turns}`, streams.aiStarDealRng(war, star, turns));
        add(`battle:${star}:${turns}`, streams.battleRng(war, star, turns));
        add(
          `conquestModes:${star}:${turns}`,
          streams.conquestModesRng(war, star, turns)
        );
        add(
          `conquestGarrison:${star}:${turns}`,
          streams.conquestGarrisonRng(war, star, turns)
        );
        add(
          `conquestFoe:${star}:${turns}`,
          streams.conquestFoeRng(war, star, turns)
        );
        add(
          `conquestAlly:${star}:${turns}`,
          streams.conquestAllyRng(war, star, turns)
        );
        add(
          `conquestScale:${star}:${turns}`,
          streams.conquestScaleRng(war, star, turns)
        );
        for (const reroll of [0, 1, 2]) {
          add(
            `explore:${star}:${turns}:${reroll}`,
            streams.exploreDealRng(war, star, turns, reroll)
          );
        }
      }
    }

    for (const team of [0, 1, 2]) {
      for (const turns of [0, 1, 2]) {
        add(
          `conquestMove:${team}:${turns}`,
          streams.conquestMoveRng(war, team, turns)
        );
        add(
          `conquestBoss:${team}:${turns}`,
          streams.conquestBossScaleRng(war, team, turns)
        );
      }
    }

    const deal = streams.exploreDealRng(war, 0, 0, 0);
    for (const iteration of [0, 1, 2]) {
      const iter = streams.iterationRng(deal, iteration);
      add(`iter:${iteration}`, streams.iterationRng(deal, iteration));
      for (const cardId of [
        "gwc_minion",
        "gwc_add_card_slot",
        "gwaio_start_lucky",
      ]) {
        add(`card:${iteration}:${cardId}`, streams.cardRng(iter, cardId));
      }
    }

    const bySeq = new Map();
    for (const entry of built) {
      const clash = bySeq.get(entry.seq);
      assert.equal(clash, undefined, `${entry.label} collides with ${clash}`);
      bySeq.set(entry.seq, entry.label);
    }
    assert.ok(built.length > 100, `only checked ${built.length} keys`);
  });

  // "uber 1" and "uber_1" are the same key by design - squashing is what stops
  // a name with a space from colliding with a two-argument stream instead.
  it("collapses a spaced name onto its underscored form", () => {
    const war = streams.warRng(SEED);
    assert.deepEqual(
      draws(streams.generalCommanderRng(war, "big bob")),
      draws(streams.generalCommanderRng(war, "big_bob"))
    );
  });
});
