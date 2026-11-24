"use strict";

// gw_play/launch_inventories.js: the hire applies each co-op player's record
// afresh, so a card whose buff() changed since the record was written reaches
// the battle at once (issue #685). The last test applies through the real
// coop_ai_effects, GWInventory and cards. See coop.md, "Records at launch".

const { describe, it, after } = require("node:test");
const assert = require("node:assert/strict");

const {
  loadCouiModule,
  installGlobals,
  registerModuleStub,
} = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const {
  installFakeMessageChannel,
} = require("../scripts/lib/fake-message-channel.js");
const {
  makeObservable,
  makeObservableArray,
} = require("../scripts/lib/fake-knockout.js");

installGlobals();
const stockBank = { addStartCard: () => true, hasStartCard: () => false };
registerModuleStub("shared/gw_common", { bank: stockBank });
registerModuleStub("shared/gw_bank", stockBank);
registerModuleStub("shared/gw_game_patches", { patch: () => {} });
registerModuleStub("shared/gw_factions", [{ minions: [] }]);

const stubs = createGlobalStubs();
stubs.setGlobal("ko", {
  observable: makeObservable,
  observableArray: makeObservableArray,
});
stubs.setGlobal("localStorage", { setItem: () => {} });
installFakeMessageChannel(stubs.setGlobal, { auto: true });
const loaded = new Map();
const requireCards = (ids, onLoad) => {
  if (typeof ids === "string") {
    return loaded.get(ids);
  }
  const card = loadCouiModule(ids[0]);
  loaded.set(ids[0], card);
  onLoad(card);
  return undefined;
};
requireCards.defined = (id) => loaded.has(id);
stubs.setGlobal("requireGW", requireCards);
after(() => stubs.restoreGlobals());

const launchInventories = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/launch_inventories.js"
);

const HOST = { id: "host", name: "Host", role: "host" };
const VIEWER = { id: "v1", name: "Ada", role: "viewer" };
const LATE = { id: "v2", name: "Alan", role: "viewer" };

function makeGame(records) {
  return {
    findCoopPlayerInventoryData: (client) => records[client.id],
  };
}

// Applies by stamping what it was given, so a result shows whose it is.
function fakeEffects() {
  const applied = [];
  return {
    applied,
    apply: (saved) => {
      applied.push(saved);
      return Promise.resolve({ cards: saved.cards, mods: ["fresh"] });
    },
  };
}

describe("launchInventories.forHire", () => {
  it("applies each hire viewer's record and each per-player AI's", async () => {
    const viewerRecord = { inventory: { cards: ["a"], mods: ["stale"] } };
    const aiInventory = { cards: ["b"], mods: ["stale"] };
    const coopAi = { tag: ".player2", perPlayer: true, inventory: aiInventory };
    const effects = fakeEffects();

    const launch = await launchInventories.forHire({
      game: makeGame({ v1: viewerRecord, v2: { inventory: { cards: [] } } }),
      clients: [HOST, VIEWER],
      coopAis: [coopAi],
      effects,
    });

    assert.deepEqual(launch.viewers, [
      { client: VIEWER, inventory: { cards: ["a"], mods: ["fresh"] } },
    ]);
    assert.deepEqual(launch.coopAis, [
      {
        tag: ".player2",
        perPlayer: true,
        inventory: { cards: ["b"], mods: ["fresh"] },
      },
    ]);
    assert.deepEqual(viewerRecord.inventory.mods, ["stale"]);
    assert.deepEqual(coopAi.inventory, aiInventory);
    assert.deepEqual(effects.applied, [viewerRecord.inventory, aiInventory]);
  });

  it("leaves a shared-tech AI on the host's inventory", async () => {
    const hostInventory = { mods: () => ["host"] };
    const coopAi = {
      tag: ".player",
      perPlayer: false,
      inventory: hostInventory,
    };
    const effects = fakeEffects();

    const launch = await launchInventories.forHire({
      game: makeGame({}),
      clients: [HOST, LATE],
      coopAis: [coopAi],
      effects,
    });

    assert.deepEqual(launch.viewers, []);
    assert.equal(launch.coopAis[0], coopAi);
    assert.deepEqual(effects.applied, []);
  });

  it("rejects when an apply fails", async () => {
    const error = new Error("apply timed out after 10000ms");

    await assert.rejects(
      launchInventories.forHire({
        game: makeGame({ v1: { inventory: { cards: [] } } }),
        clients: [HOST, VIEWER],
        coopAis: [],
        effects: { apply: () => Promise.reject(error) },
      }),
      error
    );
  });

  it("gives a record stored without ammoCost its card's current mods", async () => {
    const makeEffects = loadCouiModule(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_ai_effects.js"
    );
    const effects = makeEffects({
      GWInventory: loadCouiModule("shared/gw_inventory"),
      stockBank,
      timeoutMs: 10000,
    });
    const card = { id: "gwc_damage_artillery" };
    const fresh = await effects.apply({ cards: [card], tags: {} });
    const flagged = fresh.mods.filter((mod) => mod.ammoCost);
    assert.ok(flagged.length > 0);
    // As a record written before the card set the flag holds it.
    const stale = fresh.mods.map((mod) => {
      const copy = Object.assign({}, mod);
      delete copy.ammoCost;
      return copy;
    });

    const launch = await launchInventories.forHire({
      game: makeGame({ v1: { inventory: { cards: [card], mods: stale } } }),
      clients: [HOST, VIEWER],
      coopAis: [],
      effects,
    });

    assert.deepEqual(
      launch.viewers[0].inventory.mods.filter((mod) => mod.ammoCost),
      flagged
    );
  });
});
