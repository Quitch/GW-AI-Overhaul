define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Manhattan Upgrade Tech doubles the radius of the mobile nuke's explosion."
    ),
    summarize: _.constant("!LOC:Manhattan Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_vehicle_upgrade.png"
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
        gwaioFunctions.hasUnit("/pa/units/land/tank_nuke/tank_nuke.json")
      ) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/land/tank_nuke/tank_nuke_pbaoe.json",
          path: "splash_radius",
          op: "multiply",
          value: 2,
        },
        {
          file: "/pa/units/land/tank_nuke/tank_nuke_pbaoe.json",
          path: "full_damage_splash_radius",
          op: "multiply",
          value: 2,
        },
        {
          file: "/pa/units/land/tank_nuke/tank_nuke_pbaoe.json",
          path: "burn_radius",
          op: "multiply",
          value: 2,
        },
        {
          file: "/pa/units/land/tank_nuke/tank_nuke_pbaoe.json",
          path: "damage_volume.initial_radius",
          op: "multiply",
          value: 2,
        },
        {
          file: "/pa/units/land/tank_nuke/tank_nuke_pbaoe.json",
          path: "damage_volume.radius_velocity",
          op: "multiply",
          value: 2,
        },
        {
          file: "/pa/units/land/tank_nuke/tank_nuke_pbaoe.json",
          path: "damage_volume.burnable_remove_radius",
          op: "multiply",
          value: 2,
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
