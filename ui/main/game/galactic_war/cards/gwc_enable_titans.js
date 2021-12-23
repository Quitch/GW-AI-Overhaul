define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioFunctions, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC: Allows advanced fabricators to build all Titan-class units."
    ),
    summarize: _.constant("!LOC:Titan Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_enable_titans.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_titans_all",
      };
    },
    getContext: gwaioFunctions.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        inventory.hasCard("gwc_enable_bots_all") ||
        inventory.hasCard("gwc_enable_vehicles_all") ||
        inventory.hasCard("gwc_enable_air_all") ||
        inventory.hasCard("gwc_enable_sea_all") ||
        inventory.hasCard("gwaio_start_hoarder")
      ) {
        chance = 150;
      }
      if (!api.content.usingTitans() || inventory.hasCard("gwc_start_titan")) {
        chance = 0;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addUnits([
        gwaioUnits.zeus,
        gwaioUnits.atlas,
        gwaioUnits.ragnarok,
        gwaioUnits.ares,
        gwaioUnits.helios,
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
