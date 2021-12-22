define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioFunctions, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Slammer Upgrade Tech changes the advanced assault bot's torpedo into a rocket that targets surface units."
    ),
    summarize: _.constant("!LOC:Slammer Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_bot_combat_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_combat",
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
        (gwaioFunctions.hasUnit(gwaioUnits.botFactoryAdvanced) ||
          inventory.hasCard("gwaio_start_paratrooper") ||
          inventory.hasCard("gwaio_upgrade_botfactory")) &&
        gwaioFunctions.hasUnit(gwaioUnits.slammer)
      ) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.slammerTorpedo,
          path: "spawn_layers",
          op: "replace",
          value: "WL_Air",
        },
        {
          file: gwaioUnits.slammerTorpedo,
          path: "target_layers",
          op: "replace",
          value: ["WL_LandHorizontal", "WL_WaterSurface"],
        },
        {
          file: gwaioUnits.torpedoLauncherAmmo,
          path: "flight_layer",
          op: "replace",
          value: "Air",
        },
        {
          file: gwaioUnits.torpedoLauncherAmmo,
          path: "spawn_layers",
          op: "replace",
          value: "WL_Air",
        },
        {
          file: gwaioUnits.torpedoLauncherAmmo,
          path: "cruise_height",
          op: "replace",
          value: 75,
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
