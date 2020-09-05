define(["shared/gw_common"], function (GW) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Orbital Fabrication Tech reduces metal build costs of all orbital vehicles by 25%"
    ),
    summarize: _.constant("!LOC:Orbital Fabrication Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_orbital_fabrication.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_cost_reduction",
      };
    },
    getContext: function (galaxy) {
      return {
        totalSize: galaxy.stars().length,
      };
    },
    deal: function (system, context) {
      var chance = 0;
      var dist = system.distance();
      if (dist > 0) {
        if (context.totalSize <= GW.balance.numberOfSystems[0]) {
          chance = 100;
          if (dist > 4) chance = 50;
        } else if (context.totalSize <= GW.balance.numberOfSystems[1]) {
          chance = 100;
          if (dist > 5) chance = 50;
        } else if (context.totalSize <= GW.balance.numberOfSystems[2]) {
          chance = 100;
          if (dist > 9) chance = 50;
        } else if (context.totalSize <= GW.balance.numberOfSystems[3]) {
          chance = 28;
          if (dist > 11) chance = 50;
        } else {
          chance = 28;
          if (dist > 13) chance = 50;
        }
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      var units = [
        "/pa/units/orbital/orbital_battleship/orbital_battleship.json",
        "/pa/units/orbital/orbital_fabrication_bot/orbital_fabrication_bot.json",
        "/pa/units/orbital/orbital_fighter/orbital_fighter.json",
        "/pa/units/orbital/orbital_lander/orbital_lander.json",
        "/pa/units/orbital/orbital_laser/orbital_laser.json",
        "/pa/units/orbital/orbital_probe/orbital_probe.json",
        "/pa/units/orbital/orbital_railgun/orbital_railgun.json",
        "/pa/units/orbital/radar_satellite_adv/radar_satellite_adv.json",
        "/pa/units/orbital/radar_satellite/radar_satellite.json",
        "/pa/units/orbital/solar_array/solar_array.json",
      ];
      var mods = [];
      units.forEach(function (unit) {
        mods.push({
          file: unit,
          path: "build_metal_cost",
          op: "multiply",
          value: 0.75,
        });
      });
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
