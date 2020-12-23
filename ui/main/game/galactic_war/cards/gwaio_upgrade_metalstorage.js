define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Metal Storage Upgrade Tech doubles the storage capacity of Metal Storage."
    ),
    summarize: _.constant("!LOC:Metal Storage Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_storage_compression.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_economy",
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
          "/pa/units/land/metal_storage/metal_storage.json"
        )
      )
        chance = 70;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/land/metal_storage/metal_storage.json",
          path: "storage.metal",
          op: "multiply",
          value: 2,
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
