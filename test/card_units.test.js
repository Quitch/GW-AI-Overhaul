"use strict";

// gw_play/card_units.js mergeInto: how GWO's card-to-units list joins
// model.gwoCardsToUnits, which card mods also push to. The list itself is
// checked against the deck in card_deal_unit_gate.test.js.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");

const cardUnits = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_units.js"
);

const { setGlobal, restoreGlobals } = createGlobalStubs();
afterEach(restoreGlobals);

describe("mergeInto", () => {
  it("creates the list with every GWO entry when no card mod has", () => {
    setGlobal("model", {});
    const target = cardUnits.mergeInto();

    assert.equal(target, global.model.gwoCardsToUnits);
    assert.deepEqual(
      target.map((entry) => entry.id),
      cardUnits.cards.map((entry) => entry.id)
    );
  });

  // cards.js and card_tooltips.js each merge the list, in either order.
  it("adds every GWO entry to a list that exists, and nothing the second time", () => {
    setGlobal("model", { gwoCardsToUnits: [] });
    const target = cardUnits.mergeInto();
    const ids = cardUnits.cards.map((entry) => entry.id);

    assert.deepEqual(
      target.map((entry) => entry.id),
      ids
    );

    cardUnits.mergeInto();

    assert.deepEqual(
      target.map((entry) => entry.id),
      ids
    );
  });

  it("keeps a card mod's own entries, and its entry for a GWO id", () => {
    const modEntry = { id: "mym_card", units: ["/pa/units/mym/unit.json"] };
    const override = { id: cardUnits.cards[0].id, units: [] };
    const target = [modEntry, override];
    setGlobal("model", { gwoCardsToUnits: target });

    assert.equal(cardUnits.mergeInto(), target);

    assert.equal(target[0], modEntry);
    assert.equal(target[1], override);
    // Every other GWO entry joins after them, and the overridden id only once.
    assert.deepEqual(
      target.map((entry) => entry.id),
      ["mym_card"].concat(cardUnits.cards.map((entry) => entry.id))
    );
  });
});
