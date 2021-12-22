define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioFunctions, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Metal Extractor Upgrade Tech increases the metal production of this basic economy structure by 25% but decreases its health by 50%."
    ),
    summarize: _.constant("!LOC:Metal Extractor Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_storage_compression_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_efficiency",
      };
    },
    getContext: gwaioFunctions.getContext,
    deal: function () {
      var chance = 0;
      if (gwaioFunctions.hasUnit(gwaioUnits.metalExtractor)) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.metalExtractor,
          path: "production.metal",
          op: "multiply",
          value: 1.25,
        },
        {
          file: gwaioUnits.metalExtractor,
          path: "max_health",
          op: "multiply",
          value: 0.5,
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
