"use strict";

// What a shipped race's units in the harvested fixture
// (test/fixtures/unit_types.json) make of GWO's cards, for the race_*.test.js
// files. Each race's test registers the index, then asserts on these.

const { MOD_ROOT, loadCouiModule } = require("./amd-loader.js");

const races = loadCouiModule(MOD_ROOT + "/shared/races.js");
const cells = loadCouiModule(MOD_ROOT + "/shared/unit_cells.js");
const cardUnits = loadCouiModule(MOD_ROOT + "/gw_play/card_units.js");
const helpers = loadCouiModule(MOD_ROOT + "/shared/cards_deal_helpers.js");
const unitNames = loadCouiModule(MOD_ROOT + "/gw_play/unit_names.js");

// The { vanilla, race } cell index race_cells.js would build. `buildable` is
// optional; without it no spec carries buildable_types.
function harvestedIndex(unitTypes, buildable, bit) {
  const specs = {};
  for (const [unit, types] of Object.entries(unitTypes)) {
    specs[unit] = { unit_types: types };
    if (buildable && buildable[unit]) {
      specs[unit].buildable_types = buildable[unit];
    }
  }
  const units = Object.keys(specs);
  return {
    vanilla: cells.buildIndex(units, specs, cells.vanillaMember),
    race: cells.buildIndex(units, specs, cells.raceMember(bit)),
  };
}

function withheldCards(raceId) {
  const inventory = { getTag: () => raceId };
  return cardUnits.cards
    .filter(
      (card) => !helpers.raceCanDeal(races, inventory, card.id, cardUnits.cards)
    )
    .map((card) => card.id)
    .sort();
}

// The MLA-only cards every race is withheld, plus the race's own.
function expectedWithheld(withheldByCells) {
  return cardUnits.cards
    .map((card) => card.id)
    .filter((id) => helpers.mlaOnlyCard(id) || withheldByCells.includes(id))
    .sort();
}

// Every "card: unit" a dealable card's tooltip would list without a name,
// looked up as card_tooltips.js does: the race's table, any add-on's, then
// unit_names.js.
function unnamedCardUnits(raceId) {
  const index = races.cellsOf(raceId);
  const named = {};
  for (const entry of unitNames.units) {
    named[entry.path] = entry.name;
  }
  const isNamed = (unit) =>
    races.unitName(raceId, unit) !== undefined ||
    Object.prototype.hasOwnProperty.call(named, unit);
  const unnamed = [];
  for (const card of cardUnits.cards) {
    if (helpers.mlaOnlyCard(card.id)) {
      continue;
    }
    for (const unit of cells.cardUnitsFor(
      card.units || [],
      index.vanilla,
      index.race
    )) {
      if (!isNamed(unit)) {
        unnamed.push(card.id + ": " + unit);
      }
    }
  }
  return unnamed;
}

module.exports = {
  harvestedIndex,
  withheldCards,
  expectedWithheld,
  unnamedCardUnits,
};
