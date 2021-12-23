define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioFunctions, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Air Ammunition Tech increases damage of all mobile air units by 25%"
    ),
    summarize: _.constant("!LOC:Air Ammunition Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_combat_air.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwaioFunctions.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        inventory.hasCard("gwc_enable_air_t1") ||
        inventory.hasCard("gwc_enable_air_all") ||
        inventory.hasCard("gwc_start_air") ||
        inventory.hasCard("gwaio_start_hoarder")
      ) {
        chance = 70;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      var ammos = [
        gwaioUnits.fireflyAmmo,
        gwaioUnits.hornetAmmo,
        gwaioUnits.wyrmAmmo,
        gwaioUnits.bumblebeeAmmo,
        gwaioUnits.hummingbirdAmmo,
        gwaioUnits.phoenixAmmo,
        gwaioUnits.kestrelAmmo,
        gwaioUnits.icarusAmmo,
        gwaioUnits.horseflyAmmo,
      ];
      var mods = [];
      ammos.forEach(function (ammo) {
        mods.push({
          file: ammo,
          path: "damage",
          op: "multiply",
          value: 1.25,
        });
      });
      inventory.addMods(mods);
    },
    dull: function () {
      //empty
    },
  };
});
