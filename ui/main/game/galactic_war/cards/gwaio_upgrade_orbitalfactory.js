define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Orbital Factory Upgrade Tech decreases advanced orbital unit costs by 25% but also decreases the factory's health by 50%."
    ),
    summarize: _.constant("!LOC:Orbital Factory Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_orbital_upgrade.png"
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
    deal: function () {
      var chance = 0;
      if (
        gwaioFunctions.hasUnit(
          "/pa/units/orbital/orbital_factory/orbital_factory.json"
        )
      ) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      var units = [
        "/pa/units/orbital/solar_array/solar_array.json",
        "/pa/units/orbital/orbital_laser/orbital_laser.json",
        "/pa/units/orbital/radar_satellite_adv/radar_satellite_adv.json",
        "/pa/units/orbital/orbital_railgun/orbital_railgun.json",
        "/pa/units/orbital/orbital_battleship/orbital_battleship.json",
      ];
      var mods = units.map(function (unit) {
        return {
          file: unit,
          path: "build_metal_cost",
          op: "multiply",
          value: 0.75,
        };
      });
      mods.push({
        file: "/pa/units/orbital/orbital_factory/orbital_factory.json",
        path: "max_health",
        op: "multiply",
        value: 0.5,
      });
      inventory.addMods(mods);
    },
    dull: function () {
      //empty
    },
  };
});
