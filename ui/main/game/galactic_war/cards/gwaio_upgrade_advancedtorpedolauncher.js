define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioFunctions, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Advanced Torpedo Launcher Upgrade Tech enables the targeting of all surface units by the Advanced Torpedo Launcher."
    ),
    summarize: _.constant("!LOC:Advanced Torpedo Launcher Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_defense_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwaioFunctions.getContext,
    deal: function () {
      var chance = 0;
      if (gwaioFunctions.hasUnit(gwaioUnits.torpedoLauncherAdvanced)) {
        chance = 30;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.torpedoLauncherAdvancedWeapon,
          path: "spawn_layers",
          op: "replace",
          value: "WL_Air",
        },
        {
          file: gwaioUnits.torpedoLauncherAdvancedWeapon,
          path: "target_layers",
          op: "push",
          value: ["WL_LandHorizontal"],
        },
        {
          file: gwaioUnits.torpedoLauncherAdvancedWeapon,
          path: "exclude_unit_types",
          op: "replace",
          value: "",
        },
        {
          file: gwaioUnits.torpedoLauncherAdvancedLandAmmo,
          path: "flight_layer",
          op: "replace",
          value: "Air",
        },
        {
          file: gwaioUnits.torpedoLauncherAdvancedLandAmmo,
          path: "spawn_layers",
          op: "replace",
          value: "WL_Air",
        },
        {
          file: gwaioUnits.torpedoLauncherAdvancedLandAmmo,
          path: "cruise_height",
          op: "replace",
          value: 75,
        },
        {
          file: gwaioUnits.torpedoLauncherAdvancedWaterAmmo,
          path: "flight_layer",
          op: "replace",
          value: "Air",
        },
        {
          file: gwaioUnits.torpedoLauncherAdvancedWaterAmmo,
          path: "spawn_layers",
          op: "replace",
          value: "WL_Air",
        },
        {
          file: gwaioUnits.torpedoLauncherAdvancedWaterAmmo,
          path: "cruise_height",
          op: "replace",
          value: 75,
        },
        {
          file: gwaioUnits.torpedoLauncherAdvancedWaterAmmo,
          path: "initial_velocity",
          op: "replace",
          value: 100,
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
