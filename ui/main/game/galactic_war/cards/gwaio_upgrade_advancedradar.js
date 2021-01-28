define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Advanced Radar Upgrade Tech doubles the vision radius of advanced radar."
    ),
    summarize: _.constant("!LOC:Advanced Radar Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_energy.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_efficiency",
      };
    },
    getContext: function (galaxy) {
      return {
        totalSize: galaxy.stars().length,
      };
    },
    deal: function (_, __, inventory) {
      var chance = 0;
      if (
        gwaioFunctions.hasUnit("/pa/units/land/radar_adv/radar_adv.json") &&
        (gwaioFunctions.hasUnit(
          "/pa/units/air/air_factory_adv/air_factory_adv.json"
        ) ||
          gwaioFunctions.hasUnit(
            "/pa/units/land/bot_factory_adv/bot_factory_adv.json"
          ) ||
          inventory.hasCard("gwaio_upgrade_botfactory") ||
          gwaioFunctions.hasUnit(
            "/pa/units/sea/naval_factory_adv/naval_factory_adv.json"
          ) ||
          inventory.hasCard("gwaio_upgrade_navalfactory") ||
          gwaioFunctions.hasUnit(
            "/pa/units/land/vehicle_factory_adv/vehicle_factory_adv.json"
          ) ||
          inventory.hasCard("gwaio_upgrade_vehiclefactory"))
      )
        chance = 70;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/land/radar_adv/radar_adv.json",
          path: "recon.observer.items.0.radius",
          op: "multiply",
          value: 2,
        },
        {
          file: "/pa/units/land/radar_adv/radar_adv.json",
          path: "recon.observer.items.3.radius",
          op: "multiply",
          value: 2,
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
