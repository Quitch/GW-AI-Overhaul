define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Energy Plant Upgrade Tech increases the energy production of this basic economy structure by 25%, but decreases its health by 50%."
    ),
    summarize: _.constant("!LOC:Energy Plant Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_storage_compression.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_efficiency",
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
        gwaioFunctions.hasUnit("/pa/units/land/energy_plant/energy_plant.json")
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/land/energy_plant/energy_plant.json",
          path: "production.energy",
          op: "multiply",
          value: 1.25,
        },
        {
          file: "/pa/units/land/energy_plant/energy_plant.json",
          path: "max_health",
          op: "multiply",
          value: 0.5,
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
