define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Kaiju Upgrade Tech enables the use of teleporters by hover destroyers."
    ),
    summarize: _.constant("!LOC:Kaiju Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_naval.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_speed",
      };
    },
    getContext: function (galaxy) {
      return {
        totalSize: galaxy.stars().length,
      };
    },
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        (gwaioFunctions.hasUnit(
          "/pa/units/sea/naval_factory_adv/naval_factory_adv.json"
        ) ||
          inventory.hasCard("gwaio_upgrade_navalfactory")) &&
        gwaioFunctions.hasUnit("/pa/units/sea/hover_ship/hover_ship.json")
      )
        chance = 30;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/sea/hover_ship/hover_ship.json",
          path: "teleportable",
          op: "replace",
          value: {},
        },
        {
          file: "/pa/units/sea/hover_ship/hover_ship.json",
          path: "command_caps",
          op: "push",
          value: "ORDER_Use",
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
