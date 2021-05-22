define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Advanced Torpedo Launcher Upgrade Tech enables the targeting of all surface units by the Advanced Torpedo Launcher."
    ),
    summarize: _.constant("!LOC:Advanced Torpedo Launcher Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_defense.png"
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
      if (
        gwaioFunctions.hasUnit(
          "/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv.json"
        )
      )
        chance = 30;

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv_tool_weapon.json",
          path: "spawn_layers",
          op: "replace",
          value: "WL_Air",
        },
        {
          file: "/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv_tool_weapon.json",
          path: "target_layers",
          op: "push",
          value: ["WL_LandHorizontal"],
        },
        {
          file: "/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv_tool_weapon.json",
          path: "exclude_unit_types",
          op: "replace",
          value: "",
        },
        {
          file: "/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv_ammo_land.json",
          path: "flight_layer",
          op: "replace",
          value: "Air",
        },
        {
          file: "/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv_ammo_land.json",
          path: "spawn_layers",
          op: "replace",
          value: "WL_Air",
        },
        {
          file: "/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv_ammo_land.json",
          path: "cruise_height",
          op: "replace",
          value: 75,
        },
        {
          file: "/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv_ammo_water.json",
          path: "flight_layer",
          op: "replace",
          value: "Air",
        },
        {
          file: "/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv_ammo_water.json",
          path: "spawn_layers",
          op: "replace",
          value: "WL_Air",
        },
        {
          file: "/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv_ammo_water.json",
          path: "cruise_height",
          op: "replace",
          value: 75,
        },
        {
          file: "/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv_ammo_water.json",
          path: "initial_velocity",
          op: "replace",
          value: 100,
        },
      ]);
    },
    dull: function () {},
  };
});
