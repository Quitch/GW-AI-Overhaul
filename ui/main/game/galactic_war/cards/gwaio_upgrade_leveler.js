define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Leveler Upgrade Tech enables the building of assault tanks by the Unit Cannon."
    ),
    summarize: _.constant("!LOC:Leveler Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_vehicle.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
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
        (gwaioFunctions.hasUnit(
          "/pa/units/land/vehicle_factory_adv/vehicle_factory_adv.json"
        ) ||
          inventory.hasCard("gwaio_upgrade_vehiclefactory")) &&
        gwaioFunctions.hasUnit(
          "/pa/units/land/tank_laser_adv/tank_laser_adv.json"
        ) &&
        gwaioFunctions.hasUnit("/pa/units/land/unit_cannon/unit_cannon.json")
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/land/tank_laser_adv/tank_laser_adv.json",
          path: "unit_types",
          op: "push",
          value: "UNITTYPE_CannonBuildable",
        },
      ]);

      inventory.addAIMods([
        {
          type: "factory",
          op: "load",
          value: "gwaio_upgrade_leveler.json",
        },
      ]);
    },
    dull: function () {},
  };
});
