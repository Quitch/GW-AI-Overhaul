define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Grenadier Upgrade Tech swaps out the artillery for a mine launcher."
    ),
    summarize: _.constant("!LOC:Grenadier Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_bot_combat.png"
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
        gwaioFunctions.hasUnit("/pa/units/land/bot_factory/bot_factory.json") &&
        gwaioFunctions.hasUnit(
          "/pa/units/land/bot_grenadier/bot_grenadier.json"
        )
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
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
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
