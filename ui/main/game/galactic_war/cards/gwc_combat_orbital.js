define(["shared/gw_common"], function (GW) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Orbital Combat Tech increases speed of all orbital units by 50%, health by 50%, and damage by 25%"
    ),
    summarize: _.constant("!LOC:Orbital Combat Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_orbital.png"
    ),
    audio: function () {
      return {
        found: "PA/VO/Computer/gw/board_tech_available_combat",
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
          chance = 28;
          if (dist > 4) chance = 142;
        } else if (context.totalSize <= GW.balance.numberOfSystems[1]) {
          chance = 25;
          if (dist > 6) chance = 75;
        } else if (context.totalSize <= GW.balance.numberOfSystems[2]) {
          chance = 28;
          if (dist > 9) chance = 142;
        } else if (context.totalSize <= GW.balance.numberOfSystems[3]) {
          chance = 28;
          if (dist > 11) chance = 142;
        } else {
          chance = 28;
          if (dist > 13) chance = 142;
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
      var modUnit = function (unit) {
        mods.push({
          file: unit,
          path: "navigation.move_speed",
          op: "multiply",
          value: 1.5,
        });
        mods.push({
          file: unit,
          path: "navigation.brake",
          op: "multiply",
          value: 1.5,
        });
        mods.push({
          file: unit,
          path: "navigation.acceleration",
          op: "multiply",
          value: 1.5,
        });
        mods.push({
          file: unit,
          path: "navigation.turn_speed",
          op: "multiply",
          value: 1.5,
        });
        mods.push({
          file: unit,
          path: "max_health",
          op: "multiply",
          value: 1.5,
        });
      };
      _.forEach(units, modUnit);
      var ammos = [
        "/pa/units/orbital/orbital_fighter/orbital_fighter_ammo.json",
        "/pa/units/orbital/defense_satellite/defense_satellite_ammo_ground.json",
        "/pa/units/orbital/orbital_laser/orbital_laser_ammo.json",
        "/pa/units/orbital/orbital_railgun/orbital_railgun_ammo.json",
        "/pa/units/orbital/defense_satellite/defense_satellite_ammo_orbital.json",
        "/pa/units/orbital/orbital_battleship/orbital_battleship_ammo_ground.json",
      ];
      var modAmmo = function (ammo) {
        mods.push({
          file: ammo,
          path: "damage",
          op: "multiply",
          value: 1.25,
        });
      };
      _.forEach(ammos, modAmmo);
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
