define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Replace's the Dox's lasers with a flamethrower."
    ),
    summarize: _.constant("!LOC:Flaming Fist"),
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
        gwaioFunctions.hasUnit("/pa/units/land/assault_bot/assault_bot.json")
      )
        chance = 50;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/land/assault_bot/assault_bot.json",
          path: "tools.0.spec_id",
          op: "replace",
          value: "/pa/units/land/tank_armor/tank_armor_tool_weapon.json",
        },
        {
          file: "/pa/units/land/assault_bot/assault_bot.json",
          path: "tools.projectiles_per_fire",
          op: "replace",
          value: 1,
        },
        {
          file: "/pa/units/land/assault_bot/assault_bot.json",
          path: "events.fired.effect_spec",
          op: "replace",
          value:
            "/pa/units/land/tank_armor/tank_armor_muzzle_flame.pfx socket_rightMuzzle /pa/units/land/tank_armor/tank_armor_muzzle_flame.pfx socket_leftMuzzle",
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
