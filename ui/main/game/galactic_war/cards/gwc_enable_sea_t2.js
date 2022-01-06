define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (GW, gwaioCards, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Advanced Naval Tech enables building of the Advanced Naval Factory and advanced naval units. Advanced Naval Factories are built via your Advanced Naval Fabricators."
    ),
    summarize: _.constant("!LOC:Advanced Naval Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_naval.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_sea",
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
      inventory.addUnits([gwaioUnits.navalFabberAdvanced]);
    },
    dull: function () {
      // empty
    },
  };
});
