define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Grenadier Upgrade Tech replaces this fire support's artillery with mine launchers, triples its cost and reduces its rate of fire by 75%."
    ),
    summarize: _.constant("!LOC:Grenadier Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_bot_combat_upgrade.png"
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
          "/pa/units/land/bot_grenadier/bot_grenadier.json"
        )
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/land/bot_grenadier/bot_grenadier.json",
          path: "build_metal_cost",
          op: "multiply",
          value: 3,
        },
        {
          file: "/pa/units/land/bot_grenadier/bot_grenadier_tool_weapon.json",
          path: "rate_of_fire",
          op: "multiply",
          value: 0.25,
        },
        {
          file: "/pa/units/land/bot_grenadier/bot_grenadier_ammo.json",
          path: "damage",
          op: "replace",
          value: 0,
        },
        {
          file: "/pa/units/land/bot_grenadier/bot_grenadier_ammo.json",
          path: "splash_damage",
          op: "replace",
          value: 0,
        },
        {
          file: "/pa/units/land/bot_grenadier/bot_grenadier_ammo.json",
          path: "splash_radius",
          op: "replace",
          value: 0,
        },
        {
          file: "/pa/units/land/bot_grenadier/bot_grenadier_ammo.json",
          path: "full_damage_splash_radius",
          op: "replace",
          value: 0,
        },
        {
          file: "/pa/units/land/bot_grenadier/bot_grenadier_ammo.json",
          path: "spawn_unit_on_death",
          op: "replace",
          value: "/pa/units/land/land_mine/land_mine.json",
        },
      ]);
    },
    dull: function () {},
  };
});
