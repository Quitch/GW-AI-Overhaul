define([
  "module",
  "shared/gw_common",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (module, GW, GWCStart, gwoCard, gwoUnit) {
  var CARD = { id: module.id.substring(module.id.lastIndexOf("/") + 1) };
  var loadout = gwoCard.loadout(CARD, {
    bank: GW.bank,
    start: GWCStart,
    repeatSlot: false,
    apply: function (inventory) {
      inventory.addUnits([
        gwoUnit.ant,
        gwoUnit.skitter,
        gwoUnit.vehicleFabber,
        gwoUnit.vehicleFactory,
      ]);
    },
    // Support for GWO v4.2.2 and earlier
    always: function (inventory, context) {
      if (
        inventory.cards()[0].id === "gwc_start_subcdr" &&
        inventory.cards()[0].minions
      ) {
        _.forEach(context.minions, function (minion) {
          inventory.minions.push(minion);
        });
        var minionSpecs = _.compact(_.pluck(context.minions, "commander"));
        inventory.addUnits(minionSpecs);
      }
    },
  });
  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:General Commander"),
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:The General Commander loadout contains very limited mobile forces and only two data banks. However, the loadout comes with two Sub Commanders that accompany you into each battle."
    ),
    hint: gwoCard.lockedHint("!LOC:General Commander"),
    getContext: function (galaxy, inventory) {
      return {
        faction: inventory.getTag("global", "playerFaction") || 0,
      };
    },
    deal: gwoCard.startCard,
    buff: loadout.buff,
    dull: loadout.dull,
  };
});
