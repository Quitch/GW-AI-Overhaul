"use strict";

// shared/host_loadouts.js: the loadouts a co-op host can apply, written on its
// inventory for a viewer's loadout picker. See coop.md, "Loadouts the host can
// apply".

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");

const {
  MOD_ROOT,
  loadCouiModule,
  registerModuleStub,
} = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const { installFakeJQuery } = require("../scripts/lib/fake-jquery.js");

// The ids each publish asked the deck to load, and the modules that load:
// every id but those in `missing`, which leave a hole as setupGwoDeck does.
const requested = [];
let missing = [];
registerModuleStub(MOD_ROOT + "/shared/deal.js", {
  setupGwoDeck: (cards, deck, count, loaded, ids) => {
    requested.push(ids);
    ids.forEach((id, index) => {
      if (!missing.includes(id)) {
        cards[index] = { id };
        deck[index] = id;
      }
    });
    loaded.resolve();
  },
});

const hostLoadouts = loadCouiModule(MOD_ROOT + "/shared/host_loadouts.js");
const loadoutIds = loadCouiModule(MOD_ROOT + "/shared/loadout_ids.js");

const stubs = createGlobalStubs();
afterEach(() => {
  stubs.restoreGlobals();
  requested.length = 0;
  missing = [];
});

function inventoryWith(tags) {
  const global = Object.assign({}, tags);
  return {
    global,
    getTag: (context, name) =>
      context === "global" ? global[name] : undefined,
    setTag: (context, name, value) => {
      assert.equal(context, "global");
      global[name] = value;
    },
  };
}

describe("read", () => {
  it("reads the list the host wrote", () => {
    assert.deepEqual(
      hostLoadouts.read(
        inventoryWith({ gwaioHostLoadouts: ["gwc_start_vehicle"] })
      ),
      ["gwc_start_vehicle"]
    );
  });

  it("is undefined when the host wrote none, or wrote something else", () => {
    assert.equal(hostLoadouts.read(inventoryWith({})), undefined);
    assert.equal(
      hostLoadouts.read(inventoryWith({ gwaioHostLoadouts: "gwc_start_air" })),
      undefined
    );
    assert.equal(
      hostLoadouts.read(inventoryWith({ gwaioHostLoadouts: [1] })),
      undefined
    );
    assert.equal(hostLoadouts.read(undefined), undefined);
  });
});

describe("offers", () => {
  it("offers what the host lists, and GWO's own loadouts always", () => {
    assert.equal(hostLoadouts.offers(["mym_start_a"], "mym_start_a"), true);
    assert.equal(hostLoadouts.offers(["mym_start_a"], "mym_start_b"), false);
    assert.equal(hostLoadouts.offers(undefined, "mym_start_a"), false);
    for (const id of loadoutIds.all) {
      assert.equal(hostLoadouts.offers(undefined, id), true, id);
    }
  });
});

describe("publish", () => {
  it("writes GWO's loadouts and the scene's mod loadouts that load", () => {
    installFakeJQuery(stubs, { sync: true });
    stubs.setGlobal("model", {
      gwoStartingCards: [{ id: "gwc_start_vehicle" }, { id: "mym_start_a" }],
      gwoNewStartCards: [{ id: "mym_start_b" }, { id: "mym_start_broken" }, {}],
    });
    missing = ["mym_start_broken"];
    const inventory = inventoryWith({});

    let written;
    hostLoadouts.publish(inventory).then((ids) => {
      written = ids;
    });

    const expected = loadoutIds.all.concat("mym_start_a", "mym_start_b");
    assert.deepEqual(written, expected);
    assert.deepEqual(inventory.global.gwaioHostLoadouts, expected);
    // Each id asked for once, the broken one included.
    assert.deepEqual(
      requested[0],
      loadoutIds.all.concat("mym_start_a", "mym_start_b", "mym_start_broken")
    );
  });

  it("writes GWO's loadouts when no mod registered any", () => {
    installFakeJQuery(stubs, { sync: true });
    stubs.setGlobal("model", {});
    const inventory = inventoryWith({});

    hostLoadouts.publish(inventory);

    assert.deepEqual(inventory.global.gwaioHostLoadouts, loadoutIds.all);
  });
});
