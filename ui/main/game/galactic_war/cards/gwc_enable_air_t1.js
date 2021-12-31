define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (GW, gwaioCards, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Basic air tech enables building of mobile air units and factories. Basic air factories are built via your commander or any basic fabricator."
    ),
    summarize: _.constant("!LOC:Basic Air Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_combat_air.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_air",
      };
    },
    getContext: gwaioCards.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        !(
          inventory.hasCard("gwc_enable_air_all") ||
          inventory.hasCard("gwc_start_air") ||
          inventory.hasCard("gwc_start_allfactory") ||
          inventory.hasCard("gwaio_start_hoarder")
        )
      ) {
        var dist = system.distance();
        if (!inventory.hasCard("gwaio_start_hoarder")) {
          if (
            (context.totalSize <= GW.balance.numberOfSystems[0] && dist > 2) ||
            (context.totalSize <= GW.balance.numberOfSystems[1] && dist > 3) ||
            (context.totalSize <= GW.balance.numberOfSystems[2] && dist > 4) ||
            (context.totalSize <= GW.balance.numberOfSystems[3] && dist > 5) ||
            dist > 6
          ) {
            chance = 50;
          } else {
            chance = 200;
          }
        }
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addUnits([
        gwaioUnits.airFactory,
        gwaioUnits.firefly,
        gwaioUnits.bumblebee,
        gwaioUnits.hummingbird,
        gwaioUnits.icarus,
        gwaioUnits.pelican,
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
