define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Piranha Upgrade Tech changes the gunboat into a hover unit, allowing it to cross land and lava."
    ),
    summarize: _.constant("!LOC:Piranha Upgrade Tech"),
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
    deal: function () {
      var chance = 0;
      if (
        gwaioFunctions.hasUnit(
          "/pa/units/sea/naval_factory/naval_factory.json"
        ) &&
        gwaioFunctions.hasUnit("/pa/units/sea/sea_scout/sea_scout.json")
      )
        chance = 30;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/sea/sea_scout/sea_scout.json",
          path: "unit_types",
          op: "push",
          value: "UNITTYPE_Hover",
        },
        {
          file: "/pa/units/sea/sea_scout/sea_scout.json",
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
