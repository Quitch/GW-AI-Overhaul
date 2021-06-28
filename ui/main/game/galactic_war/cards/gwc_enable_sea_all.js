define(["shared/gw_common"], function (GW) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Complete Naval Tech enables building of all naval units and all naval factories. Basic naval factories are built via your commander or any basic fabricator. Advanced naval factories are built via basic or advanced naval fabricators."
    ),
    summarize: _.constant("!LOC:Complete Naval Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_naval.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_sea",
      };
    },
    getContext: function (galaxy) {
      return {
        totalSize: galaxy.stars().length,
      };
    },
    deal: function (system, context, inventory) {
      var chance = 0;
      var dist = system.distance();
      if (dist > 0 && !inventory.hasCard("gwaio_start_hoarder")) {
        if (context.totalSize <= GW.balance.numberOfSystems[0]) {
          chance = 25;
          if (dist > 2) chance = 200;
        } else if (context.totalSize <= GW.balance.numberOfSystems[1]) {
          chance = 25;
          if (dist > 3) chance = 200;
        } else if (context.totalSize <= GW.balance.numberOfSystems[2]) {
          chance = 25;
          if (dist > 4) chance = 200;
        } else if (context.totalSize <= GW.balance.numberOfSystems[3]) {
          chance = 25;
          if (dist > 5) chance = 200;
        } else {
          chance = 25;
          if (dist > 6) chance = 200;
        }
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addUnits([
        "/pa/units/sea/naval_factory_adv/naval_factory_adv.json",
        "/pa/units/sea/naval_factory/naval_factory.json",
      ]);
    },
    dull: function () {},
  };
});
