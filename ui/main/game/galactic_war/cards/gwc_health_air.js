define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js"], function (
  gwaioUnits
) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Air Armor Tech increases the health of all air units by 50%"
    ),
    summarize: _.constant("!LOC:Air Armor Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_combat_air.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_armor",
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
      var units = [
        gwaioUnits.firefly,
        gwaioUnits.hornet,
        gwaioUnits.wyrm,
        gwaioUnits.bumblebee,
        gwaioUnits.airFabberAdvanced,
        gwaioUnits.airFabber,
        gwaioUnits.phoenix,
        gwaioUnits.hummingbird,
        gwaioUnits.kestrel,
        gwaioUnits.icarus,
        gwaioUnits.horsefly,
        gwaioUnits.angel,
        gwaioUnits.pelican,
      ];
      var mods = [];
      var modUnit = function (unit) {
        mods.push({
          file: unit,
          path: "max_health",
          op: "multiply",
          value: 1.5,
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
