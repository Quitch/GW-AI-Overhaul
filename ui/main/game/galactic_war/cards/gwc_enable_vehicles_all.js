define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (GW, gwaioCards, gwaioGroups) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Complete Vehicle tech enables building of all Vehicle and all Vehicle Factories. Basic Vehicle factories are built via your commander or any basic fabricator. Advanced Vehicle factories are built via basic or advanced vehicle fabricators."
    ),
    summarize: _.constant("!LOC:Complete Vehicle Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_vehicle.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_vehicle",
      };
    },
    getContext: gwaioCards.getContext,

    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwaioCards.missingUnit(inventory.units(), gwaioGroups.vehicles)) {
        var dist = system.distance();
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
        if (
          !gwaioCards.hasUnit(inventory.units(), gwaioGroups.factoriesAdvanced)
        ) {
          chance *= 3;
        }
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addUnits(gwaioGroups.vehicles);
    },
    dull: function () {
      //empty
    },
  };
});
