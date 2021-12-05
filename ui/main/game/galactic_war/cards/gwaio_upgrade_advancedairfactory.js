define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Advanced Air Factory Upgrade Tech decreases advanced air unit costs by 25% but also decreases the factory's health by 50%."
    ),
    summarize: _.constant("!LOC:Advanced Air Factory Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_combat_air_upgrade.png"
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
    deal: function () {
      var chance = 0;
      if (
        gwaioFunctions.hasUnit(
          "/pa/units/air/air_factory_adv/air_factory_adv.json"
        )
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      var units = [
        "/pa/units/air/fabrication_aircraft_adv/fabrication_aircraft_adv.json",
        "/pa/units/air/bomber_adv/bomber_adv.json",
        "/pa/units/air/fighter_adv/fighter_adv.json",
        "/pa/units/air/gunship/gunship.json",
        "/pa/units/air/bomber_heavy/bomber_heavy.json",
        "/pa/units/air/support_platform/support_platform.json",
        "/pa/units/air/strafer/strafer.json",
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
        file: "/pa/units/air/air_factory_adv/air_factory_adv.json",
        path: "max_health",
        op: "multiply",
        value: 0.5,
      });
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
