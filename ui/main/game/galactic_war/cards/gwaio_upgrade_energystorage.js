define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioFunctions, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Energy Storage Upgrade Tech increases the amount of energy storage by 300%."
    ),
    summarize: _.constant("!LOC:Energy Storage Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_storage_compression_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_economy",
      };
    },
    getContext: gwaioFunctions.getContext,
    deal: function () {
      var chance = 0;
      if (gwaioFunctions.hasUnit(gwaioUnits.energyStorage)) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.energyStorage,
          path: "storage.energy",
          op: "multiply",
          value: 4,
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
