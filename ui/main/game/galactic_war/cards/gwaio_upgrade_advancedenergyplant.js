define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Advanced Energy Plant Upgrade Tech increases the energy production of this advanced economy structure by 25% but decreases its health by 50%."
    ),
    summarize: _.constant("!LOC:Advanced Energy Plant Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_storage_compression.png"
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
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        gwaioFunctions.hasUnit(
          "/pa/units/land/energy_plant_adv/energy_plant_adv.json"
        ) &&
        (gwaioFunctions.hasUnit(
          "/pa/units/air/air_factory_adv/air_factory_adv.json"
        ) ||
          inventory.hasCard("gwaio_upgrade_airfactory") ||
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
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/land/energy_plant_adv/energy_plant_adv.json",
          path: "production.energy",
          op: "multiply",
          value: 1.25,
        },
        {
          file: "/pa/units/land/energy_plant_adv/energy_plant_adv.json",
          path: "max_health",
          op: "multiply",
          value: 0.5,
        },
      ]);
    },
    dull: function () {},
  };
});
