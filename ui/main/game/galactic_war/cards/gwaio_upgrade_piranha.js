define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioFunctions, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Piranha Upgrade Tech changes the gunboat into a hover unit, allowing it to cross land and lava."
    ),
    summarize: _.constant("!LOC:Piranha Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_naval_upgrade.png"
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
        gwaioFunctions.hasUnit(gwaioUnits.navalFactory) &&
        gwaioFunctions.hasUnit(gwaioUnits.piranha)
      ) {
        chance = 30;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.piranha,
          path: "unit_types",
          op: "push",
          value: "UNITTYPE_Hover",
        },
        {
          file: gwaioUnits.piranha,
          path: "navigation.type",
          op: "replace",
          value: "hover",
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
