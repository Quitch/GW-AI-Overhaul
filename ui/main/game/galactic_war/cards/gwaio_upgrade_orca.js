define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Orca Upgrade Tech changes the destroyer to a water hover unit, preventing torpedoes from targeting it and allowing the navigation of shallow waters. Surface weapon range is increased by 50%."
    ),
    summarize: _.constant("!LOC:Orca Upgrade Tech"),
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
        gwaioFunctions.hasUnit("/pa/units/sea/destroyer/destroyer.json")
      )
        chance = 30;

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/sea/destroyer/destroyer.json",
          path: "unit_types",
          op: "push",
          value: "UNITTYPE_WaterHover",
        },
        {
          file: "/pa/units/sea/destroyer/destroyer.json",
          path: "navigation.type",
          op: "replace",
          value: "water-hover",
        },
        {
          spec_id: "/pa/units/sea/destroyer/destroyer_tool_weapon.json",
          path: "max_range",
          op: "multiply",
          value: 1.5,
        },
      ]);
    },
    dull: function () {},
  };
});
