define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Bumblebee Upgrade Tech causes the carpet bomber to drop a mine instead of bombs."
    ),
    summarize: _.constant("!LOC:Bumblebee Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_combat_air.png"
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
        gwaioFunctions.hasUnit("/pa/units/air/bomber/bomber.json") &&
        gwaioFunctions.hasUnit("/pa/units/land/land_mine/land_mine.json")
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/air/bomber/bomber_ammo.json",
          path: "damage",
          op: "replace",
          value: 0,
        },
        {
          file: "/pa/units/air/bomber/bomber_ammo.json",
          path: "splash_damage",
          op: "replace",
          value: 0,
        },
        {
          file: "/pa/units/air/bomber/bomber_ammo.json",
          path: "splash_radius",
          op: "replace",
          value: 0,
        },
        {
          file: "/pa/units/air/bomber/bomber_ammo.json",
          path: "full_damage_splash_radius",
          op: "replace",
          value: 0,
        },
        {
          file: "/pa/units/air/bomber/bomber_ammo.json",
          path: "spawn_unit_on_death",
          op: "replace",
          value: "/pa/units/land/land_mine/land_mine.json",
        },
        {
          file: "/pa/units/air/bomber/bomber_tool_weapon.json",
          path: "ammo_per_shot",
          op: "replace",
          value: 425,
        },
      ]);
    },
    dull: function () {},
  };
});
