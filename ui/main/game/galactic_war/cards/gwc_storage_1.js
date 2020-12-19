define(["shared/gw_common"], function (GW) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Metal and energy storage on all commanders and storage structures increased by 300%. Adds in blueprints for storage structures."
    ),
    summarize: _.constant("!LOC:Storage Compression Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_storage_compression.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_economy",
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
          chance = 500;
          if (dist > 4) chance = 250;
        } else if (context.totalSize <= GW.balance.numberOfSystems[1]) {
          chance = 500;
          if (dist > 6) chance = 250;
        } else if (context.totalSize <= GW.balance.numberOfSystems[2]) {
          chance = 500;
          if (dist > 9) chance = 250;
        } else if (context.totalSize <= GW.balance.numberOfSystems[3]) {
          chance = 500;
          if (dist > 10) chance = 250;
        } else {
          chance = 500;
          if (dist > 12) chance = 250;
        }
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addUnits([
        "/pa/units/land/metal_storage/metal_storage.json",
        "/pa/units/land/energy_storage/energy_storage.json",
      ]);
      var units = [
        "/pa/units/commanders/base_commander/base_commander.json",
        "/pa/units/land/metal_storage/metal_storage.json",
        "/pa/units/land/energy_storage/energy_storage.json",
        "/pa/units/orbital/mining_platform/mining_platform.json",
      ];
      var mods = [];
      var modUnit = function (unit) {
        mods.push({
          file: unit,
          path: "storage.energy",
          op: "multiply",
          value: 4.0,
        });
        mods.push({
          file: unit,
          path: "storage.metal",
          op: "multiply",
          value: 4.0,
        });
      };
      _.forEach(units, modUnit);
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
