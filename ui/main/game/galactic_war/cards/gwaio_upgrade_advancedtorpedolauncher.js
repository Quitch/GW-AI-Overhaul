define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Advanced Torpedo Launcher Upgrade Tech enables the targeting of all surface units by the Advanced Torpedo Launcher."
      ) +
        "<br> <br>" +
        loc("!LOC:Does not use a Data Bank.")
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
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), gwoUnit.torpedoLauncherAdvanced)) {
        chance = 30;
      }
      return {
        params: {
          allowOverflow: true,
        },
        chance: chance,
      };
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods([
        {
          file: gwoUnit.torpedoLauncherAdvancedWeapon,
          path: "spawn_layers",
          op: "replace",
          value: "WL_Air",
        },
        {
          file: gwoUnit.torpedoLauncherAdvancedWeapon,
          path: "target_layers",
          op: "push",
          value: ["WL_LandHorizontal"],
        },
        {
          file: gwoUnit.torpedoLauncherAdvancedWeapon,
          path: "exclude_unit_types",
          op: "replace",
          value: "",
        },
        {
          file: gwoUnit.torpedoLauncherAdvancedLandAmmo,
          path: "flight_layer",
          op: "replace",
          value: "Air",
        },
        {
          file: gwoUnit.torpedoLauncherAdvancedLandAmmo,
          path: "spawn_layers",
          op: "replace",
          value: "WL_Air",
        },
        {
          file: gwoUnit.torpedoLauncherAdvancedLandAmmo,
          path: "cruise_height",
          op: "replace",
          value: 75,
        },
        {
          file: gwoUnit.torpedoLauncherAdvancedWaterAmmo,
          path: "flight_layer",
          op: "replace",
          value: "Air",
        },
        {
          file: gwoUnit.torpedoLauncherAdvancedWaterAmmo,
          path: "spawn_layers",
          op: "replace",
          value: "WL_Air",
        },
        {
          file: gwoUnit.torpedoLauncherAdvancedWaterAmmo,
          path: "cruise_height",
          op: "replace",
          value: 75,
        },
        {
          file: gwoUnit.torpedoLauncherAdvancedWaterAmmo,
          path: "initial_velocity",
          op: "replace",
          value: 100,
        },
      ]);
    },
    dull: function () {},
  };
});
