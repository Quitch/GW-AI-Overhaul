define([
  "module",
  "shared/gw_common",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (module, GW, GWCStart, gwoCard, gwoUnit, gwoGroup) {
  var CARD = { id: module.id.substring(module.id.lastIndexOf("/") + 1) };
  var loadout = gwoCard.loadout(CARD, {
    bank: GW.bank,
    start: GWCStart,
    apply: function (inventory) {
      inventory.addUnits(
        gwoGroup.airBasic.concat(gwoGroup.botsBasic, gwoGroup.vehiclesBasic)
      );
    },
    dulls: function (inventory) {
      var mineGranted = _.some(
        [
          "gwaio_upgrade_bumblebee",
          "gwaio_upgrade_grenadier",
          "gwaio_upgrade_sheller",
        ],
        function (cardId) {
          return inventory.hasCard(cardId);
        }
      );
      var restricted = mineGranted
        ? _.without(gwoGroup.structuresDefencesBasic, gwoUnit.landMine)
        : gwoGroup.structuresDefencesBasic;
      return restricted;
    },
  });
  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Assault Commander"),
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:The Assault Commander loadout contains all basic factories and units but no basic defenses."
    ),
    hint: gwoCard.lockedHint("!LOC:Assault Commander"),
    deal: gwoCard.startCard,
    buff: loadout.buff,
    dull: loadout.dull,
  };
});
