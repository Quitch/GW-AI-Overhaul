define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
], function (module, GWCStart, gwoBank, gwoCard) {
  var CARD = { id: module.id.substring(module.id.lastIndexOf("/") + 1) };
  var loadout = gwoCard.loadout(CARD, {
    bank: gwoBank,
    start: GWCStart,
  });
  return {
    visible: _.constant(false),
    summarize: function () {
      return "!LOC:Lucky Commander";
    },
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:The Lucky Commander is offered four cards instead of three at every planet."
    ),
    hint: gwoCard.lockedHint("!LOC:Lucky Commander"),
    deal: gwoCard.startCard,
    buff: loadout.buff,
    dull: loadout.dull,
  };
});
