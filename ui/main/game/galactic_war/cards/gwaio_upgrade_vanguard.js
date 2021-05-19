define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Vanguard Upgrade Tech makes the heavy tank amphibious."
    ),
    summarize: _.constant("!LOC:Vanguard Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_vehicle.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_speed",
      };
    },
    getContext: function (galaxy) {
      return {
        totalSize: galaxy.stars().length,
      };
    },
    deal: function (system, context, inventory) {
      var hasUnit = gwaioFunctions.hasUnit();
      var chance = 0;
      if (
        (hasUnit(
          "/pa/units/land/vehicle_factory_adv/vehicle_factory_adv.json"
        ) ||
          inventory.hasCard("gwaio_upgrade_vehiclefactory")) &&
        hasUnit("/pa/units/land/tank_heavy_armor/tank_heavy_armor.json")
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/land/tank_heavy_armor/tank_heavy_armor.json",
          path: "unit_types",
          op: "push",
          value: "UNITTYPE_Amphibious",
        },
        {
          file: "/pa/units/land/tank_heavy_armor/tank_heavy_armor.json",
          path: "navigation.type",
          op: "replace",
          value: "amphibious",
        },
      ]);
    },
    dull: function () {},
  };
});
