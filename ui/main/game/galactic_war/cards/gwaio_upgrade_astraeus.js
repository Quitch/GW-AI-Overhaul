define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioFunctions, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Astraeus Upgrade Tech increases the orbital lander's interplanetary movement speed by 200%."
    ),
    summarize: _.constant("!LOC:Astraeus Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_orbital_upgrade.png"
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
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        gwaioFunctions.hasUnit(gwaioUnits.astraeus) &&
        (gwaioFunctions.hasUnit(gwaioUnits.orbitalLauncher) ||
          inventory.hasCard("gwaio_upgrade_orbitallauncher"))
      ) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.astraeus,
          path: "system_velocity_multiplier",
          op: "multiply",
          value: 3,
        },
        {
          file: gwaioUnits.astraeus,
          path: "gravwell_velocity_multiplier",
          op: "multiply",
          value: 3,
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
