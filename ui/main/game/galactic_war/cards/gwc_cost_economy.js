define(["shared/gw_common"], function (GW) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Economy Fabrication Tech reduces metal build costs of all metal and energy production structures by 50%"
    ),
    summarize: _.constant("!LOC:Economy Fabrication Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_economy_fabrication.png"
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
          chance = 100;
          if (dist > 11) chance = 50;
        } else {
          chance = 100;
          if (dist > 13) chance = 50;
        }
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      var units = [
        "/pa/units/land/energy_plant/energy_plant.json",
        "/pa/units/land/energy_plant_adv/energy_plant_adv.json",
        "/pa/units/land/energy_storage/energy_storage.json",
        "/pa/units/land/metal_extractor/metal_extractor.json",
        "/pa/units/land/metal_extractor_adv/metal_extractor_adv.json",
        "/pa/units/land/metal_storage/metal_storage.json",
        "/pa/units/orbital/mining_platform/mining_platform.json",
      ];
      var mods = [];
      units.forEach(function (unit) {
        mods.push({
          file: unit,
          path: "build_metal_cost",
          op: "multiply",
          value: 0.5,
        });
      });
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
