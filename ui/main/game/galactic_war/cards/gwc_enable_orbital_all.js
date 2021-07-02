define(["shared/gw_common"], function (GW) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Complete Orbital Tech enables building of all orbital units and all orbital Factories. Orbital launchers are built by any basic fabricator. Orbital factories are built via an orbital fabricator."
    ),
    summarize: _.constant("!LOC:Complete Orbital Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_orbital.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_orbital",
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
          inventory.hasCard("gwc_start_orbital") ||
          inventory.hasCard("nem_start_deepspace") ||
          inventory.hasCard("gwaio_start_hoarder")
        )
      ) {
        var dist = system.distance();
        if (dist > 0) {
          if (context.totalSize <= GW.balance.numberOfSystems[0]) {
            chance = 100;
            if (dist > 2) chance = 250;
          } else if (context.totalSize <= GW.balance.numberOfSystems[1]) {
            chance = 100;
            if (dist > 3) chance = 250;
          } else if (context.totalSize <= GW.balance.numberOfSystems[2]) {
            chance = 100;
            if (dist > 4) chance = 250;
          } else if (context.totalSize <= GW.balance.numberOfSystems[3]) {
            chance = 100;
            if (dist > 5) chance = 250;
          } else {
            chance = 100;
            if (dist > 6) chance = 250;
          }
        }
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addUnits([
        "/pa/units/orbital/mining_platform/mining_platform.json",
        "/pa/units/orbital/orbital_fabrication_bot/orbital_fabrication_bot.json",
        "/pa/units/orbital/orbital_factory/orbital_factory.json",
        "/pa/units/orbital/orbital_fighter/orbital_fighter.json",
        "/pa/units/orbital/orbital_laser/orbital_laser.json",
        "/pa/units/orbital/orbital_probe/orbital_probe.json",
        "/pa/units/orbital/radar_satellite/radar_satellite.json",
        "/pa/units/orbital/solar_array/solar_array.json",
      ]);
    },
    dull: function () {},
  };
});
