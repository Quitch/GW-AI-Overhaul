define(["shared/gw_common"], function (GW) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Orbital Armor Tech increases health of all orbital units by 50%"
    ),
    summarize: _.constant("!LOC:Orbital Armor Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_orbital.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_armor",
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
          chance = 14;
        } else if (context.totalSize <= GW.balance.numberOfSystems[1]) {
          chance = 14;
        } else if (context.totalSize <= GW.balance.numberOfSystems[2]) {
          chance = 28;
          if (dist > 6) chance = 142;
        } else if (context.totalSize <= GW.balance.numberOfSystems[3]) {
          chance = 28;
          if (dist > 9) chance = 142;
        } else {
          chance = 28;
          if (dist > 12) chance = 142;
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
          path: "max_health",
          op: "multiply",
          value: 1.5,
        });
      });
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
