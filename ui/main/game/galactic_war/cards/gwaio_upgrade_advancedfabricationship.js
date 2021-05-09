define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Advanced Fabrication Ship Upgrade Tech changes the advanced naval fabricator into a hover unit, allowing it to cross land and lava."
    ),
    summarize: _.constant("!LOC:Advanced Fabrication Ship Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_metal.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_sea",
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
          "/pa/units/sea/naval_factory_adv/naval_factory_adv.json"
        ) &&
        gwaioFunctions.hasUnit(
          "/pa/units/sea/fabrication_ship_adv/fabrication_ship_adv.json"
        )
      )
        chance = 30;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/sea/fabrication_ship_adv/fabrication_ship_adv.json",
          path: "unit_types",
          op: "push",
          value: "UNITTYPE_Hover",
        },
        {
          file: "/pa/units/sea/fabrication_ship_adv/fabrication_ship_adv.json",
          path: "navigation.type",
          op: "replace",
          value: "hover",
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
