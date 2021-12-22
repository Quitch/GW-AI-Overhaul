define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioFunctions, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Fabrication Aircraft Upgrade Tech enables the building of advanced structures by the basic air fabricator."
    ),
    summarize: _.constant("!LOC:Fabrication Aircraft Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_metal_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_air",
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
        gwaioFunctions.hasUnit(gwaioUnits.airFactory) &&
        gwaioFunctions.hasUnit(gwaioUnits.airFabber)
      ) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.airFabber,
          path: "buildable_types",
          op: "add",
          value: " | Land & Structure & Advanced - Factory | FabAdvBuild",
        },
      ]);

      inventory.addAIMods([
        {
          type: "fabber",
          op: "append",
          toBuild: "AdvancedNavalDefense",
          idToMod: "builders",
          value: "BasicAirFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "AdvancedAirDefense",
          idToMod: "builders",
          value: "BasicAirFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "AdvancedLandDefense",
          idToMod: "builders",
          value: "BasicAirFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "AntiNukeSilo",
          idToMod: "builders",
          value: "BasicAirFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "AdvancedRadar",
          idToMod: "builders",
          value: "BasicAirFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "TML",
          idToMod: "builders",
          value: "BasicAirFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "NukeSilo",
          idToMod: "builders",
          value: "BasicAirFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "UnitCannon",
          idToMod: "builders",
          value: "BasicAirFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "LongRangeArtillery",
          idToMod: "builders",
          value: "BasicAirFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "ControlModule",
          idToMod: "builders",
          value: "BasicAirFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "PlanetEngine",
          idToMod: "builders",
          value: "BasicAirFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "PlanetSplitter",
          idToMod: "builders",
          value: "BasicAirFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "TeslaGunship",
          idToMod: "builders",
          value: "BasicAirFabber",
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
