define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (module, GWCStart, gwoBank, gwoCard, gwoGroup) {
  var CARD = { id: module.id.substring(module.id.lastIndexOf("/") + 1) };
  var loadout = gwoCard.loadout(CARD, {
    bank: gwoBank,
    start: GWCStart,
    apply: function (inventory) {
      inventory.addUnits(
        gwoGroup.air.concat(
          gwoGroup.bots,
          gwoGroup.naval,
          gwoGroup.orbital,
          gwoGroup.vehicles,
          gwoGroup.starterUnitsAdvanced
        )
      );
    },
  });
  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Hoarder Commander"),
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
    },
    describe: function () {
      if (gwoCard.isEnglish()) {
        return "!LOC:Contains every factory on every tier of the tech tree.";
      }
      return "!LOC:Contains every factory on every tier of the tech tree, but this has left no space for anything else. You will need to seek out additional data banks.";
    },
    hint: gwoCard.lockedHint("!LOC:Hoarder Commander"),
    deal: gwoCard.startCard,
    buff: loadout.buff,
    dull: loadout.dull,
  };
});
