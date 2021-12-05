define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
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
      if (
        gwaioFunctions.hasUnit(
          "/pa/units/land/bot_factory_adv/bot_factory_adv.json"
        )
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      var units = [
        "/pa/units/land/bot_tactical_missile/bot_tactical_missile.json",
        "/pa/units/land/fabrication_bot_adv/fabrication_bot_adv.json",
        "/pa/units/land/fabrication_bot_combat_adv/fabrication_bot_combat_adv.json",
        "/pa/units/land/assault_bot_adv/assault_bot_adv.json",
        "/pa/units/land/bot_sniper/bot_sniper.json",
        "/pa/units/land/bot_nanoswarm/bot_nanoswarm.json",
        "/pa/units/land/bot_support_commander/bot_support_commander.json",
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
        file: "/pa/units/land/bot_factory_adv/bot_factory_adv.json",
        path: "max_health",
        op: "multiply",
        value: 0.5,
      });
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
