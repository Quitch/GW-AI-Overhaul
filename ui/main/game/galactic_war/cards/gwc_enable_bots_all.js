define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (GW, gwaioCards, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Complete Bot tech enables building of all Bots and all Bot Factories. Basic Bot factories are built via your commander or any basic fabricator. Advanced Bot factories are built via basic or advanced bot fabricators."
    ),
    summarize: _.constant("!LOC:Complete Bot Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_bot_factory.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_bot",
      };
    },
    getContext: gwaioCards.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (!inventory.hasCard("gwaio_start_hoarder")) {
        var dist = system.distance();
        var chanceMod = 1;
        if (
          !(
            inventory.hasCard("gwc_enable_vehicles_all") ||
            inventory.hasCard("gwc_enable_air_all") ||
            inventory.hasCard("gwaio_start_hoarder")
          )
        ) {
          chanceMod = 3;
        }
        if (!inventory.hasCard("gwaio_start_hoarder")) {
          if (
            (context.totalSize <= GW.balance.numberOfSystems[0] && dist > 2) ||
            (context.totalSize <= GW.balance.numberOfSystems[1] && dist > 3) ||
            (context.totalSize <= GW.balance.numberOfSystems[2] && dist > 4) ||
            (context.totalSize <= GW.balance.numberOfSystems[3] && dist > 5) ||
            dist > 6
          ) {
            chance = 200;
          } else {
            chance = 25;
          }
        }
        chance *= chanceMod;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addUnits([
        gwaioUnits.dox,
        gwaioUnits.stinger,
        gwaioUnits.boom,
        gwaioUnits.botFactoryAdvanced,
        gwaioUnits.botFactory,
        gwaioUnits.grenadier,
        gwaioUnits.spark,
        gwaioUnits.stitch,
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
