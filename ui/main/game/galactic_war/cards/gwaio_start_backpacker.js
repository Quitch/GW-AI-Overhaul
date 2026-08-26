define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (module, GWCStart, gwoBank, gwoCard, gwoUnit) {
  var CARD = { id: module.id.substring(module.id.lastIndexOf("/") + 1) };
  var loadout = gwoCard.loadout(CARD, {
    bank: gwoBank,
    start: GWCStart,
    apply: function (inventory) {
      inventory.addUnits([gwoUnit.botFabber, gwoUnit.botFactory, gwoUnit.dox]);
      inventory.maxCards(inventory.maxCards() + 12);
    },
  });
  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Backpacker Commander"),
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:Contains 16 data banks. Alas, travelling light means you start with only the most basic of bots."
    ),
    hint: gwoCard.lockedHint("!LOC:Backpacker Commander"),
    deal: gwoCard.startCard,
    buff: loadout.buff,
    dull: loadout.dull,
  };
});
