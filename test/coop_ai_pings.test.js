"use strict";

// gw_play/coop_ai_pings.js: which star a co-op AI player pings, whether it
// cares enough to, and when. See coop.md, "AI pings".

const { describe, it, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");

const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const coopAiPings = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_ai_pings.js"
);

afterEach(() => {
  mock.restoreAll();
});

const candidate = (star, value, threat, hops) => ({
  star: star,
  value: value,
  threat: threat,
  hops: hops === undefined ? 1 : hops,
});

describe("pickCandidates", () => {
  it("keeps the treasure planet only when it is the only star", () => {
    const treasure = { star: 9, treasure: true };
    const ordinary = { star: 3 };
    assert.deepEqual(coopAiPings.pickCandidates([treasure, ordinary]), [
      ordinary,
    ]);
    assert.deepEqual(coopAiPings.pickCandidates([treasure]), [treasure]);
    assert.deepEqual(coopAiPings.pickCandidates([]), []);
  });
});

describe("rank", () => {
  it("scores a card's share of the best card less 0.6 of the threat's share of the worst", () => {
    const ranked = coopAiPings.rank([candidate(1, 10, 2), candidate(2, 5, 4)]);
    assert.deepEqual(
      ranked.map((entry) => [entry.star, entry.score]),
      [
        [1, 0.7],
        [2, -0.1],
      ]
    );
  });

  it("breaks a tie by the nearer star, then the lower index", () => {
    const ranked = coopAiPings.rank([
      candidate(5, 4, 1, 2),
      candidate(4, 4, 1, 1),
      candidate(3, 4, 1, 1),
    ]);
    assert.deepEqual(
      ranked.map((entry) => entry.star),
      [3, 4, 5]
    );
  });

  // A card worth less than nothing counts as nothing, and with no card worth
  // anything, or no threat anywhere, that part is 0 for every star.
  it("copes with nothing to divide by", () => {
    const ranked = coopAiPings.rank([candidate(1, -3, 0), candidate(2, 0, 0)]);
    assert.deepEqual(
      ranked.map((entry) => entry.score),
      [0, 0]
    );
    assert.deepEqual(coopAiPings.rank([]), []);
  });
});

describe("median", () => {
  it("is the middle value, or the mean of the middle two", () => {
    assert.equal(coopAiPings.median([5, 1, 3]), 3);
    assert.equal(coopAiPings.median([4, 1, 2, 3]), 2.5);
    assert.equal(coopAiPings.median([]), 0);
  });
});

describe("reasonToPing", () => {
  const WANT = coopAiPings.PING_WANT;

  it("pings a star whose card the AI wants", () => {
    const ranked = coopAiPings.rank([
      candidate(1, WANT, 5),
      candidate(2, WANT, 5),
    ]);
    assert.equal(coopAiPings.reasonToPing(ranked, [5, 5]), "wants");
  });

  it("pings a clear favourite", () => {
    const ranked = coopAiPings.rank([candidate(1, 4, 1), candidate(2, 1, 1)]);
    assert.equal(coopAiPings.reasonToPing(ranked, [1, 1]), "lead");
  });

  it("stays silent when no star stands out and no card is wanted", () => {
    const ranked = coopAiPings.rank([candidate(1, 4, 1), candidate(2, 3.5, 1)]);
    assert.equal(coopAiPings.reasonToPing(ranked, [1, 1]), undefined);
  });

  it("takes a lone star as a favourite only when it is safer than most", () => {
    const lone = coopAiPings.rank([candidate(1, 2, 3)]);
    assert.equal(coopAiPings.reasonToPing(lone, [3, 5, 8]), "lead");
    assert.equal(coopAiPings.reasonToPing(lone, [1, 2, 3]), undefined);
  });

  it("has no reason with no star", () => {
    assert.equal(coopAiPings.reasonToPing([], []), undefined);
  });
});

describe("windowKey and describe", () => {
  it("keys a window by the turn, the star, the deal count, and the cards", () => {
    assert.equal(coopAiPings.windowKey(5, 2, 3), "5:2:3");
    assert.equal(coopAiPings.windowKey(5, 2, 3, "k1"), "5:2:3:k1");
  });

  it("digests the cards the stars offer, the same cards the same way", () => {
    const digest = coopAiPings.cardsDigest(["2=gwc_a", "3=gwc_b"]);
    assert.match(digest, /^[0-9a-z]+$/);
    assert.equal(coopAiPings.cardsDigest(["2=gwc_a", "3=gwc_b"]), digest);
    assert.notEqual(coopAiPings.cardsDigest(["2=gwc_a", "3=gwc_c"]), digest);
    assert.notEqual(coopAiPings.cardsDigest([]), digest);
  });

  it("formats one line per AI and window", () => {
    const ranked = coopAiPings.rank([
      Object.assign(candidate(2, 13.9, 4.2), { card: "gwc_cost_orbital" }),
      candidate(7, 0, 6, 2),
    ]);
    assert.equal(
      coopAiPings.describe("Sorian", "5:1:3", ranked, "ping 2 (wants)"),
      "[GW COOP AI] Sorian ping window 5:1:3 candidates: " +
        "2=0.58 (gwc_cost_orbital 13.9, threat 4.2, hops 1), " +
        "7=-0.6 (no card 0, threat 6, hops 2) -> ping 2 (wants)"
    );
    assert.equal(
      coopAiPings.describe("Sorian", "5:1:3", [], "no ping (indifferent)"),
      "[GW COOP AI] Sorian ping window 5:1:3 candidates: none -> no ping (indifferent)"
    );
  });
});

describe("valueOfCard", () => {
  const holder = {
    playerId: "gwo_ai_1",
    inventory: { cards: [] },
    commander: "cdr",
  };
  const card = { id: "gwc_x" };

  function judge(overrides) {
    const calls = { withCard: [], teamDomains: [], chance: [] };
    const lookup = {
      reachable: (units) => units,
      cellOf: () => undefined,
      ownersOf: () => [],
    };
    return {
      calls,
      judge: Object.assign(
        {
          lookup: () => lookup,
          effects: {
            withCard: (inventory, dealt, loadout) => {
              calls.withCard.push([inventory, dealt.id, loadout]);
              return Promise.resolve([
                { cards: [], units: [], mods: [], maxCards: 3 },
                { cards: [dealt], units: [], mods: [], maxCards: 3 },
              ]);
            },
          },
          teamDomains: (playerId) => {
            calls.teamDomains.push(playerId);
            return [];
          },
          namesUnits: () => false,
          chanceOf: (dealt, applied, star) => {
            calls.chance.push([dealt.id, star]);
            return 50;
          },
          isLoadout: () => false,
        },
        overrides
      ),
    };
  }

  it("judges the card against the holder's inventory as a hand would", async () => {
    const { judge: j, calls } = judge();
    const value = await coopAiPings.valueOfCard(j, holder, card, 4);

    assert.deepEqual(calls.withCard, [[holder.inventory, "gwc_x", false]]);
    assert.deepEqual(calls.teamDomains, ["gwo_ai_1"]);
    // No visible effect: its deal chance sets its floor.
    assert.deepEqual(calls.chance, [["gwc_x", 4]]);
    assert.equal(typeof value, "number");
  });

  it("is worth nothing before the unit lookup is in, or with no inventory", async () => {
    const { judge: j, calls } = judge({ lookup: () => undefined });
    assert.equal(await coopAiPings.valueOfCard(j, holder, card, 4), 0);
    assert.deepEqual(calls.withCard, []);

    const withLookup = judge();
    assert.equal(
      await coopAiPings.valueOfCard(
        withLookup.judge,
        { playerId: "gwo_ai_1" },
        card,
        4
      ),
      0
    );
  });
});

describe("the ping window", () => {
  const TANK = { id: "gwo_ai_1", name: "Tank" };
  const SORIAN = { id: "gwo_ai_2", name: "Sorian" };

  function setup(overrides) {
    const state = Object.assign(
      {
        key: "1:0:1",
        open: true,
        ais: [TANK],
        candidates: [
          { star: 2, hops: 1, threat: 1 },
          { star: 3, hops: 1, threat: 1 },
        ],
        allThreats: [1, 1],
        values: { 2: 20, 3: 1 },
        pingResult: true,
        now: 100000,
      },
      overrides
    );
    const calls = { delays: [], pings: [], log: [] };
    mock.method(console, "log", (line) => calls.log.push(line));
    mock.method(console, "error", (line) => calls.log.push(line));

    const pings = coopAiPings({
      ais: () => state.ais,
      windowKey: () => state.key,
      windowOpen: () => state.open,
      candidates: () => {
        if (state.candidatesThrow) {
          throw new Error("galaxy gone");
        }
        return state.candidates;
      },
      allThreats: () => state.allThreats,
      cardFor: (ai, star) =>
        state.noCard ? undefined : { id: (ai.card || "card") + "_" + star },
      valueOf: (ai, card, star) => {
        if (state.valueThrows) {
          throw new Error("apply failed");
        }
        return state.values[star];
      },
      ping: (star, sender) => {
        calls.pings.push([star, sender.name]);
        return state.pingResult;
      },
      delay: (fn, ms) => calls.delays.push({ fn: fn, ms: ms }),
      now: () => state.now,
    });

    // Runs every delayed settle, and waits for its judging.
    const flush = async () => {
      const due = calls.delays.splice(0);
      for (const entry of due) {
        entry.fn();
      }
      await new Promise((resolve) => setImmediate(resolve));
      await new Promise((resolve) => setImmediate(resolve));
    };

    return { pings, state, calls, flush };
  }

  it("staggers the AIs in slot order", () => {
    const { pings, calls } = setup({ ais: [TANK, SORIAN] });
    pings.update();
    assert.deepEqual(
      calls.delays.map((entry) => entry.ms),
      [
        coopAiPings.FIRST_DELAY_MS,
        coopAiPings.FIRST_DELAY_MS + coopAiPings.STAGGER_MS,
      ]
    );
  });

  it("pings the star the AI wants, and logs why", async () => {
    const { pings, calls, flush } = setup();
    pings.update();
    await flush();

    assert.deepEqual(calls.pings, [[2, "Tank"]]);
    assert.equal(calls.log.length, 1);
    assert.match(
      calls.log[0],
      /^\[GW COOP AI\] Tank ping window 1:0:1 candidates: 2=/
    );
    assert.match(calls.log[0], / -> ping 2 \(wants\)$/);
  });

  it("stays silent, and says so, with no star to ping", async () => {
    const { pings, calls, flush } = setup({ candidates: [] });
    pings.update();
    await flush();

    assert.deepEqual(calls.pings, []);
    assert.match(calls.log[0], /candidates: none -> no ping \(no star\)$/);
  });

  it("stays silent, and says so, when it does not care", async () => {
    const { pings, calls, flush } = setup({ values: { 2: 4, 3: 3.9 } });
    pings.update();
    await flush();

    assert.deepEqual(calls.pings, []);
    assert.match(calls.log[0], / -> no ping \(indifferent\)$/);
  });

  it("runs each AI once a window", async () => {
    const { pings, calls, flush } = setup();
    pings.update();
    await flush();
    pings.update();
    await flush();

    assert.equal(calls.pings.length, 1);
    assert.equal(calls.log.length, 1);
  });

  it("gives an AI added while the window is open its turn", async () => {
    const { pings, state, calls, flush } = setup();
    pings.update();
    await flush();

    state.ais = [TANK, SORIAN];
    pings.update();
    assert.equal(calls.delays.length, 1);
    await flush();

    assert.equal(calls.log.length, 2);
    assert.match(calls.log[1], /^\[GW COOP AI\] Sorian ping window 1:0:1 /);
  });

  it("leaves a star another AI pinged this window alone", async () => {
    const { pings, calls, flush } = setup({ ais: [TANK, SORIAN] });
    pings.update();
    await flush();

    assert.deepEqual(calls.pings, [[2, "Tank"]]);
    assert.match(
      calls.log[1],
      /^\[GW COOP AI\] Sorian .* -> no ping \(Tank pinged 2\)$/
    );
  });

  it("pings the same star once, and a new one only after the wait", async () => {
    const { pings, state, calls, flush } = setup();
    pings.update();
    await flush();

    state.key = "2:0:1";
    pings.update();
    await flush();
    assert.match(calls.log[1], /-> no ping \(pinged 2 already\)$/);

    state.key = "3:0:1";
    state.values = { 2: 1, 3: 20 };
    pings.update();
    await flush();
    assert.match(calls.log[2], /-> no ping \(pinged 2 too recently\)$/);

    state.key = "4:0:1";
    state.now += coopAiPings.REPING_MS;
    pings.update();
    await flush();
    assert.deepEqual(calls.pings, [
      [2, "Tank"],
      [3, "Tank"],
    ]);
  });

  it("says so when the host refuses the ping, and does not count it", async () => {
    const { pings, state, calls, flush } = setup({ pingResult: false });
    pings.update();
    await flush();
    assert.match(calls.log[0], /-> no ping \(refused\)$/);

    state.pingResult = true;
    state.key = "2:0:1";
    pings.update();
    await flush();
    assert.deepEqual(calls.pings, [
      [2, "Tank"],
      [2, "Tank"],
    ]);
  });

  it("does nothing while the war is busy, and settles once it is quiet", async () => {
    const { pings, state, calls, flush } = setup({ open: false });
    pings.update();
    assert.deepEqual(calls.delays, []);

    state.open = true;
    pings.update();
    await flush();
    assert.equal(calls.pings.length, 1);
  });

  // Judging takes time: the settle checks again before it pings.
  it("drops a settle whose window has moved on or closed", async () => {
    const moved = setup();
    moved.pings.update();
    moved.state.key = "9:9:9";
    await moved.flush();
    assert.deepEqual(moved.calls.pings, []);
    assert.deepEqual(moved.calls.log, []);

    const closed = setup();
    closed.pings.update();
    closed.state.open = false;
    await closed.flush();
    assert.deepEqual(closed.calls.pings, []);
  });

  it("gives an AI whose window closed early its turn when it reopens", async () => {
    const { pings, state, calls, flush } = setup();
    pings.update();
    state.open = false;
    pings.update();
    await flush();
    assert.deepEqual(calls.pings, []);

    state.open = true;
    pings.update();
    await flush();
    assert.deepEqual(calls.pings, [[2, "Tank"]]);
  });

  it("values a star with no card, or a card that fails to judge, at nothing", async () => {
    const noCard = setup({ noCard: true });
    noCard.pings.update();
    await noCard.flush();
    assert.match(noCard.calls.log[0], /2=-0.6 \(no card 0,/);

    const failing = setup({ valueThrows: true });
    failing.pings.update();
    await failing.flush();
    assert.match(failing.calls.log[0], /2=-0.6 \(card_2 0,/);
    assert.deepEqual(failing.calls.pings, []);
  });

  // A deal or a star-card refresh may rewrite the AI's record between the
  // window opening and its settle.
  it("judges with the AI as it is when it settles", async () => {
    const { pings, state, calls, flush } = setup();
    pings.update();
    state.ais = [Object.assign({}, TANK, { card: "fresh" })];
    await flush();

    assert.match(calls.log[0], /2=\S+ \(fresh_2 /);
  });

  it("drops the settle of an AI kicked meanwhile", async () => {
    const { pings, state, calls, flush } = setup();
    pings.update();
    state.ais = [];
    await flush();

    assert.deepEqual(calls.log, []);
    assert.deepEqual(calls.pings, []);
  });

  it("logs a settle that throws, and carries on", async () => {
    const { pings, state, calls, flush } = setup({ candidatesThrow: true });
    pings.update();
    await flush();
    assert.equal(calls.log[0], "[GW COOP AI] Tank ping failed: galaxy gone");

    state.candidatesThrow = false;
    state.key = "2:0:1";
    pings.update();
    await flush();
    assert.deepEqual(calls.pings, [[2, "Tank"]]);
  });
});
