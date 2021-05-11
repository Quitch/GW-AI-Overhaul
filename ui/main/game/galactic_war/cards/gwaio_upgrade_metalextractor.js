define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Metal Extractor Upgrade Tech increases the metal production of this basic economy structure by 25% but decreases its health by 50%."
    ),
    summarize: _.constant("!LOC:Metal Extractor Upgrade Tech"),
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
        gwaioFunctions.hasUnit(
          "/pa/units/land/metal_extractor/metal_extractor.json"
        )
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/land/metal_extractor/metal_extractor.json",
          path: "production.metal",
          op: "multiply",
          value: 1.25,
        },
        {
          file: "/pa/units/land/metal_extractor/metal_extractor.json",
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
