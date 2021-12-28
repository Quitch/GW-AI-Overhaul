define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (GW, gwaioCards, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Basic Bot tech enables building of basic Bots and basic Bot Factories. Basic Bot factories are built via your commander or any basic fabricator."
    ),
    summarize: _.constant("!LOC:Basic Bot Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_bot_combat.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_bot",
      };
    },
    getContext: gwaioCards.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        !(
          inventory.hasCard("gwc_enable_bots_all") ||
          inventory.hasCard("gwc_start_bot") ||
          inventory.hasCard("gwc_start_allfactory") ||
          inventory.hasCard("gwaio_start_hoarder") ||
          inventory.hasCard("tgw_start_speed")
        )
      ) {
        var dist = system.distance();
        if (dist > 0 && !inventory.hasCard("gwaio_start_hoarder")) {
          if (context.totalSize <= GW.balance.numberOfSystems[0]) {
            chance = 250;
            if (dist > 2) {
              chance = 100;
            }
          } else if (context.totalSize <= GW.balance.numberOfSystems[1]) {
            chance = 250;
            if (dist > 3) {
              chance = 100;
            }
          } else if (context.totalSize <= GW.balance.numberOfSystems[2]) {
            chance = 250;
            if (dist > 4) {
              chance = 100;
            }
          } else if (context.totalSize <= GW.balance.numberOfSystems[3]) {
            chance = 250;
            if (dist > 5) {
              chance = 100;
            }
          } else {
            chance = 250;
            if (dist > 6) {
              chance = 100;
            }
          }
        }
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addUnits([
        gwaioUnits.dox,
        gwaioUnits.stinger,
        gwaioUnits.boom,
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
