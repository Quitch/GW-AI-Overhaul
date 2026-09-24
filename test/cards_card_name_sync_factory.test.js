"use strict";

// The factory half of gw_play/cards_card_name_sync.js: the host names each AI
// star after the tech card it holds and mirrors that to viewers over the
// gwo_sync_star_card_name operator, which the same factory registers a handler
// for. The three naming helpers underneath are pinned in
// cards_card_name_sync.test.js.

const { describe, it, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");

const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const {
  createGlobalStubs,
  trackActive,
} = require("../scripts/lib/global-stubs.js");
const { installFakeJQuery } = require("../scripts/lib/fake-jquery.js");
const { rejection } = require("../scripts/lib/coop-fixtures.js");

const makeFactory = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_card_name_sync.js"
);

const OPERATOR = "gwo_sync_star_card_name";

const starWithAi = (ai) => ({ ai: () => ai });

function setup(overrides = {}) {
  const options = Object.assign(
    {
      cards: { gwc_combat_bots: { summarize: () => "Combat Bots" } },
      boardAi: {},
      gameAi: {},
    },
    overrides
  );

  const calls = { sent: [], requested: [] };
  const handlers = {};

  const stubs = createGlobalStubs();
  installFakeJQuery(stubs);
  stubs.setGlobal("requireGW", (ids, done, fail) => {
    const cardId = ids[0].slice("cards/".length);
    calls.requested.push(cardId);
    if (options.failLoad) {
      fail(new Error("load failed"));
      return;
    }
    done(options.cards[cardId]);
  });

  const model = {
    galaxy: {
      systems: () => [undefined, { star: starWithAi(options.boardAi) }],
    },
  };
  model.registerCampaignHostOperatorHandler = (name, fn) => {
    handlers[name] = fn;
  };
  model.sendCampaignHostOperator = function (name, payload) {
    calls.sent.push([name, payload, arguments[2]]);
  };
  stubs.setGlobal("model", model);

  const sync = makeFactory({
    game: {
      galaxy: () => ({
        stars: () => [undefined, starWithAi(options.gameAi)],
      }),
    },
  });

  return {
    sync,
    handlers,
    calls,
    options,
    restore: () => stubs.restoreGlobals(),
  };
}

const { build, release } = trackActive(setup);

afterEach(() => {
  mock.restoreAll();
});

async function capture(stream, run) {
  const mocked = mock.method(console, stream, () => {});
  await run();
  return mocked.mock.calls.map((call) => call.arguments[0]);
}

describe("card name sync - naming a star the host explored", () => {
  it("names the star after its card and tells the viewers", async () => {
    const { sync, calls, options } = build();
    const system = { star: starWithAi(options.boardAi) };

    await sync.setCardName(system, [{ id: "gwc_combat_bots" }], 1);

    assert.equal(options.boardAi.cardName, "Combat Bots");
    // A star's name is the same for everybody, so this one is deliberately not
    // addressed: no options means every connected viewer. Contrast the reroll
    // and general-commander replies, which name one player and must say so.
    // See coop.md, "Addressing a host's reply".
    assert.deepEqual(calls.sent, [
      [OPERATOR, { star: 1, card_id: "gwc_combat_bots" }, undefined],
    ]);
  });

  it("does nothing for a star holding no card", async () => {
    const { sync, calls, options } = build();
    const system = { star: starWithAi(options.boardAi) };

    await sync.setCardName(system, [], 1);
    await sync.setCardName(system, undefined, 1);
    await sync.setCardName(system, [{}], 1);

    assert.deepEqual(calls.requested, []);
    assert.deepEqual(calls.sent, []);
    assert.equal(options.boardAi.cardName, undefined);
  });

  // validate:cards checks shipped cards only, so a third-party card can lack
  // summarize. The star keeps its name, and the deal waiting on this still
  // settles.
  it("resolves without naming anything when the card has no summarize", async () => {
    const { sync, calls, options } = build({ cards: { gwc_odd: {} } });
    const system = { star: starWithAi(options.boardAi) };

    await sync.setCardName(system, [{ id: "gwc_odd" }], 1);

    assert.equal(options.boardAi.cardName, undefined);
    assert.deepEqual(calls.sent, []);
  });

  // The turn deal waits on this, and a throw in a requireGW success callback
  // would leave it waiting forever.
  it("resolves and logs when the card's summarize throws", async () => {
    const { sync, calls, options } = build({
      cards: {
        gwc_broken: {
          summarize: () => {
            throw new Error("summarize exploded");
          },
        },
      },
    });
    const system = { star: starWithAi(options.boardAi) };

    const errors = await capture("error", () =>
      sync.setCardName(system, [{ id: "gwc_broken" }], 1)
    );

    assert.equal(options.boardAi.cardName, undefined);
    assert.deepEqual(calls.sent, []);
    assert.match(
      errors[0],
      /^GWO failed to name star after card gwc_broken: Error: summarize exploded/
    );
  });

  it("resolves and logs when the star has no AI", async () => {
    const { sync, calls } = build();

    const errors = await capture("error", () =>
      sync.setCardName(
        { star: starWithAi(null) },
        [{ id: "gwc_combat_bots" }],
        1
      )
    );

    assert.deepEqual(calls.sent, []);
    assert.match(
      errors[0],
      /^GWO failed to name star after card gwc_combat_bots/
    );
  });

  it("resolves and logs when the card fails to load", async () => {
    const { sync, calls, options } = build({ failLoad: true });
    const system = { star: starWithAi(options.boardAi) };

    const errors = await capture("error", () =>
      sync.setCardName(system, [{ id: "gwc_combat_bots" }], 1)
    );

    assert.equal(options.boardAi.cardName, undefined);
    assert.deepEqual(calls.sent, []);
    assert.deepEqual(errors, [
      "GWO card failed to load for star name: gwc_combat_bots",
    ]);
  });
});

// The star index reaches the operator payload, so it is validated before any
// broadcast - and the star is still named locally either way.
describe("card name sync - when the broadcast is skipped", () => {
  it("skips a star with no usable index", async () => {
    for (const starIndex of [undefined, "1", NaN]) {
      const { sync, calls, options } = build();
      const system = { star: starWithAi(options.boardAi) };

      await sync.setCardName(system, [{ id: "gwc_combat_bots" }], starIndex);

      assert.deepEqual(calls.sent, [], String(starIndex));
      release();
    }
  });
});

describe("card name sync - applying a name a viewer received", () => {
  it("registers itself against the sync operator", () => {
    const { handlers } = build();
    assert.equal(typeof handlers[OPERATOR], "function");
  });

  // Both graphs: model.galaxy is the live board, game.galaxy() is what the save
  // is written from, and they are separate object trees.
  it("names the star in the live board and the saved galaxy alike", async () => {
    const { handlers, options } = build();

    await handlers[OPERATOR]({
      payload: { star: 1, card_id: "gwc_combat_bots" },
    });

    assert.equal(options.boardAi.cardName, "Combat Bots");
    assert.equal(options.gameAi.cardName, "Combat Bots");
  });

  // The payload crosses the wire, so it is validated rather than trusted.
  it("rejects a malformed payload", async () => {
    for (const payload of [
      { star: "1", card_id: "gwc_combat_bots" },
      { star: NaN, card_id: "gwc_combat_bots" },
      { star: 1, card_id: "" },
      { star: 1 },
      {},
    ]) {
      const { handlers, calls } = build();
      const errors = await capture("error", async () => {
        assert.match(
          await rejection(handlers[OPERATOR]({ payload })),
          /Invalid synced star card name payload/
        );
      });
      assert.deepEqual(calls.requested, [], JSON.stringify(payload));
      assert.equal(errors.length, 1);
      release();
    }
  });

  it("rejects an operator carrying no payload at all", async () => {
    const { handlers } = build();
    await capture("error", async () => {
      assert.match(
        await rejection(handlers[OPERATOR]({})),
        /Invalid synced star card name payload/
      );
      assert.match(
        await rejection(handlers[OPERATOR](undefined)),
        /Invalid synced star card name payload/
      );
    });
  });

  // A viewer running a different card set than the host, or an id the host
  // renamed - either way there is no name to apply.
  it("rejects a card this client cannot summarise", async () => {
    const { handlers } = build({ cards: { gwc_odd: {} } });

    const errors = await capture("error", async () => {
      assert.match(
        await rejection(
          handlers[OPERATOR]({ payload: { star: 1, card_id: "gwc_odd" } })
        ),
        /Card summarize unavailable for gwc_odd/
      );
    });

    assert.match(errors[0], /card summarize unavailable/);
  });

  it("rejects and logs the stack when the card's summarize throws", async () => {
    const { handlers } = build({
      cards: {
        gwc_broken: {
          summarize: () => {
            throw new Error("summarize exploded");
          },
        },
      },
    });

    const errors = await capture("error", async () => {
      assert.match(
        await rejection(
          handlers[OPERATOR]({ payload: { star: 1, card_id: "gwc_broken" } })
        ),
        /Card summarize threw for gwc_broken/
      );
    });

    assert.match(
      errors[0],
      /^\[GW COOP\] card summarize\(\) threw for id=gwc_broken: Error: summarize exploded/
    );
  });

  it("warns and rejects when neither graph holds the star", async () => {
    const { handlers } = build();

    const warnings = await capture("warn", async () => {
      assert.match(
        await rejection(
          handlers[OPERATOR]({
            payload: { star: 9, card_id: "gwc_combat_bots" },
          })
        ),
        /Unable to apply card name to star 9/
      );
    });

    assert.match(warnings[0], /unable to apply synced star card name/);
  });
});
