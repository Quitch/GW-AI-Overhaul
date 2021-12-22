define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwaioFunctions, gwaioGroups) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Air Engine Tech increases the speed of all air units by 25%"
    ),
    summarize: _.constant("!LOC:Air Engine Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_air_engine.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_speed",
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
      var units = gwaioGroups.mobileAir;
      var mods = [];
      var modUnit = function (unit) {
        mods.push({
          file: unit,
          path: "navigation.move_speed",
          op: "multiply",
          value: 1.25,
        });
        mods.push({
          file: unit,
          path: "navigation.brake",
          op: "multiply",
          value: 1.25,
        });
        mods.push({
          file: unit,
          path: "navigation.acceleration",
          op: "multiply",
          value: 1.25,
        });
        mods.push({
          file: unit,
          path: "navigation.turn_speed",
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
