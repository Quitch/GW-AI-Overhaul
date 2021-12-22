define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioFunctions, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:SXX-1304 Laser Platform Upgrade Tech removes the delay between orbital laser platforms arriving at a planet and responding to orders."
    ),
    summarize: _.constant("!LOC:SXX-1304 Laser Platform Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_orbital_fighter_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_speed",
      };
    },
    getContext: function (galaxy) {
      return {
        totalSize: galaxy.stars().length,
      };
    },
    deal: function () {
      var chance = 0;
      if (
        gwaioFunctions.hasUnit(gwaioUnits.orbitalFactory) &&
        gwaioFunctions.hasUnit(gwaioUnits.sxx)
      ) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.sxx,
          path: "planetary_arrival_cooldown_time",
          op: "replace",
          value: 0,
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
