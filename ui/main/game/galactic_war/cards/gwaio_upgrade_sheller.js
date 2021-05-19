define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Sheller Upgrade Tech causes mines to be left by the mortar tank's attacks."
    ),
    summarize: _.constant("!LOC:Sheller Upgrade Tech"),
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
      var hasUnit = gwaioFunctions.hasUnit();
      var chance = 0;
      if (
        (hasUnit(
          "/pa/units/land/vehicle_factory_adv/vehicle_factory_adv.json"
        ) ||
          inventory.hasCard("gwaio_upgrade_vehiclefactory")) &&
        hasUnit("/pa/units/land/tank_heavy_mortar/tank_heavy_mortar.json")
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/land/tank_heavy_mortar/tank_heavy_mortar_ammo.json",
          path: "spawn_unit_on_death",
          op: "replace",
          value: "/pa/units/land/land_mine/land_mine.json",
        },
      ]);
    },
    dull: function () {},
  };
});
