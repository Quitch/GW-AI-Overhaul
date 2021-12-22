define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioFunctions, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Advanced Bot Factory Upgrade Tech decreases advanced bot unit costs by 25% but also decreases the factory's health by 50%."
    ),
    summarize: _.constant("!LOC:Advanced Bot Factory Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_bot_combat_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_bot",
      };
    },
    getContext: function (galaxy) {
      return {
        totalSize: galaxy.stars().length,
      };
    },
    deal: function () {
      var chance = 0;
      if (gwaioFunctions.hasUnit(gwaioUnits.botFactoryAdvanced)) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      var units = [
        gwaioUnits.bluehawk,
        gwaioUnits.botFabberAdvanced,
        gwaioUnits.mend,
        gwaioUnits.slammer,
        gwaioUnits.gilE,
        gwaioUnits.locusts,
        gwaioUnits.colonel,
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
        file: gwaioUnits.botFactoryAdvanced,
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
