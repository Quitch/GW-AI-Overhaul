define(["shared/gw_common"], function (GW) {
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
    getContext: function (galaxy) {
      return {
        totalSize: galaxy.stars().length,
      };
    },
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
        if (dist > 0 && !inventory.hasCard("gwaio_start_hoarder")) {
          if (context.totalSize <= GW.balance.numberOfSystems[0]) {
            chance = 200;
            if (dist > 2) chance = 50;
          } else if (context.totalSize <= GW.balance.numberOfSystems[1]) {
            chance = 200;
            if (dist > 3) chance = 50;
          } else if (context.totalSize <= GW.balance.numberOfSystems[2]) {
            chance = 200;
            if (dist > 4) chance = 50;
          } else if (context.totalSize <= GW.balance.numberOfSystems[3]) {
            chance = 200;
            if (dist > 5) chance = 50;
          } else {
            chance = 200;
            if (dist > 6) chance = 50;
          }
        }
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addUnits([
        "/pa/units/air/air_factory/air_factory.json",
        "/pa/units/air/air_scout/air_scout.json",
        "/pa/units/air/bomber/bomber.json",
        "/pa/units/air/fighter/fighter.json",
        "/pa/units/air/solar_drone/solar_drone.json",
        "/pa/units/air/transport/transport.json",
      ]);
    },
    dull: function () {},
  };
});
