define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Colonel Upgrade Tech causes support commanders to explode on death."
    ),
    summarize: _.constant("!LOC:Colonel Upgrade Tech"),
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
    deal: function (_, __, inventory) {
      var chance = 0;
      if (
        (gwaioFunctions.hasUnit(
          "/pa/units/land/bot_factory_adv/bot_factory_adv.json"
        ) ||
          inventory.hasCard("gwaio_upgrade_botfactory")) &&
        gwaioFunctions.hasUnit(
          "/pa/units/land/bot_support_commander/bot_support_commander.json"
        )
      )
        chance = 70;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file:
            "/pa/units/land/bot_support_commander/bot_support_commander.json",
          path: "death_weapon.ground_ammo_spec",
          op: "replace",
          value: "/pa/ammo/nuke_pbaoe/nuke_pbaoe.json",
        },
        {
          file:
            "/pa/units/land/bot_support_commander/bot_support_commander.json",
          path: "death_weapon.air_ammo_spec",
          op: "replace",
          value: "/pa/ammo/nuke_pbaoe/nuke_pbaoe_air.json",
        },
        {
          file:
            "/pa/units/land/bot_support_commander/bot_support_commander.json",
          path: "death_weapon.air_height_threshold",
          op: "replace",
          value: 50,
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
