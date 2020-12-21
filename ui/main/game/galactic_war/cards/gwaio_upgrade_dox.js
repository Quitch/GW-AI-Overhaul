define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Dox Upgrade Tech replaces the basic infantry's current weapons with flamethrowers."
    ),
    summarize: _.constant("!LOC:Dox Upgrade Tech"),
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
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      var unit = "/pa/units/land/assault_bot/assault_bot.json";
      var weapon = "/pa/units/land/assault_bot/assault_bot_tool_weapon.json";
      var ammo = "/pa/units/land/assault_bot/assault_bot_ammo.json";
      var mods = [
        {
          file: unit,
          path: "events.fired.effect_spec",
          op: "replace",
          value:
            "/pa/units/land/tank_armor/tank_armor_muzzle_flame.pfx socket_rightMuzzle /pa/units/land/tank_armor/tank_armor_muzzle_flame.pfx socket_leftMuzzle",
        },
        {
          file: weapon,
          path: "max_range",
          op: "replace",
          value: 20,
        },
        {
          file: weapon,
          path: "spread_fire",
          op: "replace",
          value: true,
        },
        {
          file: ammo,
          path: "ammo_type",
          op: "replace",
          value: "AMMO_Beam",
        },
        {
          file: ammo,
          path: "damage",
          op: "replace",
          value: 100,
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
