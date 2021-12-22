define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js"], function (
  gwaioUnits
) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Vehicle Ammunition Tech increases damage of all vehicles by 25%"
    ),
    summarize: _.constant("!LOC:Vehicle Ammunition Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_vehicle.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: function (galaxy) {
      return {
        totalSize: galaxy.stars().length,
      };
    },
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        inventory.hasCard("gwc_enable_vehicles_t1") ||
        inventory.hasCard("gwc_enable_vehicles_all") ||
        inventory.hasCard("gwc_start_vehicle") ||
        inventory.hasCard("gwaio_start_hoarder")
      ) {
        chance = 70;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      var units = [
        gwaioUnits.spinnerAmmo,
        gwaioUnits.skitterAmmo,
        gwaioUnits.skitterAmmo,
        gwaioUnits.infernoAmmo,
        gwaioUnits.stormAmmo,
        gwaioUnits.vanguardAmmo,
        gwaioUnits.drifterAmmo,
        gwaioUnits.levelerAmmo,
        gwaioUnits.antAmmo,
      ];
      var mods = [];
      var modUnit = function (unit) {
        mods.push({
          file: unit,
          path: "damage",
          op: "multiply",
          value: 1.25,
        });
      };
      _.forEach(units, modUnit);
      inventory.addMods(mods);
    },
    dull: function () {
      //empty
    },
  };
});
