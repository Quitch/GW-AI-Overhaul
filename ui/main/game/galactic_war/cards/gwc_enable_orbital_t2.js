define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (GW, gwaioCards, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Advanced Orbital Tech enables the building of orbital fabricators and orbital factories. Orbital fabricators are built via the orbital launcher and orbital factories build by the orbital fabricators."
    ),
    summarize: _.constant("!LOC:Advanced Orbital Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_orbital.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_orbital",
      };
    },
    getContext: gwaioCards.getContext,
    deal: function (system, context) {
      var chance = 0;
      var dist = system.distance();
      if (
        context.totalSize <= GW.balance.numberOfSystems[0] ||
        context.totalSize <= GW.balance.numberOfSystems[1]
      ) {
        chance = 50;
      } else if (
        (context.totalSize <= GW.balance.numberOfSystems[2] && dist > 5) ||
        (context.totalSize <= GW.balance.numberOfSystems[3] && dist > 6) ||
        dist > 7
      ) {
        chance = 45;
      } else {
        chance = 181;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addUnits([
        gwaioUnits.orbitalFactory,
        gwaioUnits.orbitalFabber,
        gwaioUnits.jig,
      ]);
    },
    dull: function () {
      // empty
    },
  };
});
