define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Vehicle Factory Upgrade Tech enables the building of advanced units by basic vehicle manufacturing."
    ),
    summarize: _.constant("!LOC:Vehicle Factory Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_vehicle_factory.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_vehicle",
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
          "/pa/units/land/vehicle_factory/vehicle_factory.json"
        )
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/land/vehicle_factory/vehicle_factory.json",
          path: "buildable_types",
          op: "replace",
          value: "Tank & Mobile & FactoryBuild",
        },
      ]);

      inventory.addAIMods([
        {
          type: "factory",
          op: "append",
          toBuild: "AdvancedVehicleFabber",
          idToMod: "builders",
          value: "BasicVehicleFactory",
        },
        {
          type: "factory",
          op: "append",
          toBuild: "AdvancedLaserTank",
          idToMod: "builders",
          value: "BasicVehicleFactory",
        },
        {
          type: "factory",
          op: "append",
          toBuild: "AdvancedArmorTank",
          idToMod: "builders",
          value: "BasicVehicleFactory",
        },
        {
          type: "factory",
          op: "append",
          toBuild: "AdvancedArtilleryVehicle",
          idToMod: "builders",
          value: "BasicVehicleFactory",
        },
        {
          type: "factory",
          op: "append",
          toBuild: "FlakTank",
          idToMod: "builders",
          value: "BasicVehicleFactory",
        },
        {
          type: "factory",
          op: "replace",
          toBuild: "BasicVehicleFabber",
          idToMod: "priority",
          value: 220,
        },
        {
          type: "factory",
          op: "replace",
          toBuild: "LandScout",
          idToMod: "priority",
          value: 210,
          refId: "priority",
          refValue: 98,
        },
      ]);
    },
    dull: function () {},
  };
});
