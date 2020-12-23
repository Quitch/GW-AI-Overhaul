define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Stinger Upgrade Tech adds splash damage to the anti-air bot's missiles."
    ),
    summarize: _.constant("!LOC:Stinger Upgrade Tech"),
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
        gwaioFunctions.hasUnit("/pa/units/land/bot_tesla/bot_aa.json")
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/land/bot_tesla/bot_aa_ammo.json",
          path: "splash_damage",
          op: "replace",
          value: 10,
        },
        {
          file: "/pa/units/land/bot_tesla/bot_aa_ammo.json",
          path: "splash_damage",
          op: "replace",
          value: 0.75,
        },
        {
          file: "/pa/units/land/bot_tesla/bot_aa_ammo.json",
          path: "full_damage_splash_radius",
          op: "replace",
          value: 0.75,
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
