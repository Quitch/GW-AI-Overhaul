define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Firefly Upgrade Tech causes the carpet bomber to drop mines instead of bombs."
    ),
    summarize: _.constant("!LOC:Firefly Upgrade Tech"),
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
        gwaioFunctions.hasUnit("/pa/units/air/air_factory/air_factory.json") &&
        gwaioFunctions.hasUnit("/pa/units/air/bomber/bomber.json")
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
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
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
