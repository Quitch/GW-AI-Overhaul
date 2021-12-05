define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Advanced Naval Factory Upgrade Tech decreases advanced naval unit costs by 25% but also decreases the factory's health by 50%."
    ),
    summarize: _.constant("!LOC:Advanced Naval Factory Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_naval_upgrade.png"
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
    deal: function () {
      var chance = 0;
      if (
        gwaioFunctions.hasUnit(
          "/pa/units/sea/naval_factory_adv/naval_factory_adv.json"
        )
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      var units = [
        "/pa/units/sea/fabrication_ship_adv/fabrication_ship_adv.json",
        "/pa/units/sea/missile_ship/missile_ship.json",
        "/pa/units/sea/battleship/battleship.json",
        "/pa/units/sea/nuclear_sub/nuclear_sub.json",
        "/pa/units/sea/hover_ship/hover_ship.json",
        "/pa/units/sea/drone_carrier/carrier/carrier.json",
        "/pa/units/sea/drone_carrier/drone/drone.json",
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
        file: "/pa/units/sea/naval_factory_adv/naval_factory_adv.json",
        path: "max_health",
        op: "multiply",
        value: 0.5,
      });
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
