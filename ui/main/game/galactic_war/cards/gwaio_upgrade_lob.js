define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Lob Upgrade Tech increases the range of the Lob by 150%."
    ),
    summarize: _.constant("!LOC:Lob Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_artillery.png"
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
        gwaioFunctions.hasUnit(
          "/pa/units/land/artillery_unit_launcher/artillery_unit_launcher.json"
        )
      )
        if (
          gwaioFunctions.hasUnit(
            "/pa/units/land/bot_factory/bot_factory.json"
          ) ||
          gwaioFunctions.hasUnit(
            "/pa/units/air/air_factory/air_factory.json"
          ) ||
          gwaioFunctions.hasUnit(
            "/pa/units/sea/naval_factory/naval_factory.json"
          ) ||
          gwaioFunctions.hasUnit(
            "/pa/units/land/vehicle_factory/vehicle_factory.json"
          ) ||
          inventory.hasCard("gwaio_start_paratrooper") ||
          inventory.hasCard("gwc_start_artillery")
        )
          chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file:
            "/pa/units/land/artillery_unit_launcher/artillery_unit_launcher_tool_weapon.json",
          path: "max_range",
          op: "multiply",
          value: 2.5,
        },
        {
          file:
            "/pa/units/land/artillery_unit_launcher/artillery_unit_launcher_tool_weapon.json",
          path: "max_firing_velocity",
          op: "multiply",
          value: 2.5,
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
