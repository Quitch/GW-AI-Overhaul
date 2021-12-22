define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioFunctions, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Ares Upgrade Tech increases the range of the rolling fortress by 25%."
    ),
    summarize: _.constant("!LOC:Ares Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_enable_titans_upgrade.png"
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
    deal: function () {
      var chance = 0;
      if (gwaioFunctions.hasUnit(gwaioUnits.ares)) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.aresWeapon,
          path: "max_range",
          op: "multiply",
          value: 1.25,
        },
        {
          file: gwaioUnits.aresWeapon,
          path: "pitch_range",
          op: "replace",
          value: 89,
        },
        {
          file: gwaioUnits.aresWeapon,
          path: "arc_type",
          op: "replace",
          value: "ARC_high",
        },
        {
          file: gwaioUnits.aresSecondary,
          path: "max_range",
          op: "multiply",
          value: 1.25,
        },
        {
          file: gwaioUnits.aresSecondaryAmmo,
          path: "max_velocity",
          op: "replace",
          value: 200,
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
