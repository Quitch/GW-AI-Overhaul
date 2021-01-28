define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Kraken Upgrade Tech increases the range of the advanced submarine's weapons by 50%."
    ),
    summarize: _.constant("!LOC:Kraken Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_naval.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_combat",
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
          "/pa/units/sea/naval_factory_adv/naval_factory_adv.json"
        ) ||
          inventory.hasCard("gwaio_upgrade_navalfactory")) &&
        gwaioFunctions.hasUnit("/pa/units/sea/nuclear_sub/nuclear_sub.json")
      )
        chance = 35;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/sea/nuclear_sub/nuclear_sub_tool_weapon.json",
          path: "max_range",
          op: "multiply",
          value: 1.5,
        },
        {
          file:
            "/pa/units/sea/nuclear_sub/nuclear_sub_tool_weapon_missile.json",
          path: "max_range",
          op: "multiply",
          value: 1.5,
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
