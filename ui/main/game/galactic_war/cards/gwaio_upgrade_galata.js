define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Galata Upgrade Tech enables the targeting of land and surface naval units by anti-air defense."
    ),
    summarize: _.constant("!LOC:Galata Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_turret.png"
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
      if (gwaioFunctions.hasUnit("/pa/units/land/air_defense/air_defense.json"))
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/land/air_defense/air_defense.json",
          path: "unit_types",
          op: "push",
          value: "UNITTYPE_SurfaceDefense",
        },
        {
          file: "/pa/units/land/air_defense/air_defense_tool_weapon.json",
          path: "target_layers",
          op: "push",
          value: ["WL_LandHorizontal", "WL_WaterSurface"],
        },
        {
          file: "/pa/units/land/air_defense/air_defense_tool_weapon.json",
          path: "target_priorities",
          op: "push",
          value: ["Mobile & (Land | Naval)"],
        },
        {
          file: "/pa/units/land/air_defense/air_defense_ammo.json",
          path: "armor_damage_map",
          op: "replace",
          value: {},
        },
      ]);
    },
    dull: function () {},
  };
});
