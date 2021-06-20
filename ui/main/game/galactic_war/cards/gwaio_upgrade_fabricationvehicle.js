define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Fabrication Vehicle Upgrade Tech enables the building of advanced structures by the basic vehicle fabricator."
    ),
    summarize: _.constant("!LOC:Fabrication Vehicle Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_metal.png"
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
        ) &&
        gwaioFunctions.hasUnit(
          "/pa/units/land/fabrication_vehicle/fabrication_vehicle.json"
        )
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/land/fabrication_vehicle/fabrication_vehicle.json",
          path: "buildable_types",
          op: "replace",
          value:
            "Structure & Land & Advanced - Factory | Factory & Land & Tank & Advanced | FabAdvBuild | FabBuild",
        },
      ]);

      inventory.addAIMods([
        {
          type: "fabber",
          op: "append",
          toBuild: "AdvancedNavalDefense",
          idToMod: "builders",
          value: "BasicVehicleFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "AdvancedAirDefense",
          idToMod: "builders",
          value: "BasicVehicleFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "AdvancedLandDefense",
          idToMod: "builders",
          value: "BasicVehicleFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "AntiNukeSilo",
          idToMod: "builders",
          value: "BasicVehicleFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "AdvancedMetalExtractor",
          idToMod: "builders",
          value: "BasicVehicleFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "AdvancedEnergyGenerator",
          idToMod: "builders",
          value: "BasicVehicleFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "AdvancedRadar",
          idToMod: "builders",
          value: "BasicVehicleFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "TML",
          idToMod: "builders",
          value: "BasicVehicleFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "NukeSilo",
          idToMod: "builders",
          value: "BasicVehicleFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "UnitCannon",
          idToMod: "builders",
          value: "BasicVehicleFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "LongRangeArtillery",
          idToMod: "builders",
          value: "BasicVehicleFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "ControlModule",
          idToMod: "builders",
          value: "BasicVehicleFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "PlanetEngine",
          idToMod: "builders",
          value: "BasicVehicleFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "PlanetSplitter",
          idToMod: "builders",
          value: "BasicVehicleFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "FortressVehicle",
          idToMod: "builders",
          value: "BasicVehicleFabber",
        },
      ]);
    },
    dull: function () {},
  };
});
