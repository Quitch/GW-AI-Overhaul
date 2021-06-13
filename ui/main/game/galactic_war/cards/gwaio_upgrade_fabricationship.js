define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Fabrication Ship Upgrade Tech enables the building of advanced structures by the basic naval fabricator."
    ),
    summarize: _.constant("!LOC:Fabrication Ship Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_metal.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_sea",
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
          "/pa/units/sea/naval_factory/naval_factory.json"
        ) &&
        gwaioFunctions.hasUnit(
          "/pa/units/sea/fabrication_ship/fabrication_ship.json"
        )
      )
        chance = 30;

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/sea/fabrication_ship/fabrication_ship.json",
          path: "buildable_types",
          op: "replace",
          value:
            "Naval & Structure & Advanced | Naval & Factory & Advanced | FabAdvBuild | FabBuild",
        },
      ]);

      inventory.addAIMods([
        {
          type: "fabber",
          op: "add",
          toBuild: "AdvancedNavalDefense",
          idToMod: "builders",
          value: "BasicNavalFabber",
        },
        {
          type: "fabber",
          op: "add",
          toBuild: "AdvancedAirDefense",
          idToMod: "builders",
          value: "BasicNavalFabber",
        },
        {
          type: "fabber",
          op: "add",
          toBuild: "AdvancedLandDefense",
          idToMod: "builders",
          value: "BasicNavalFabber",
        },
        {
          type: "fabber",
          op: "add",
          toBuild: "AntiNukeSilo",
          idToMod: "builders",
          value: "BasicNavalFabber",
        },
        {
          type: "fabber",
          op: "add",
          toBuild: "AdvancedMetalExtractor",
          idToMod: "builders",
          value: "BasicNavalFabber",
        },
        {
          type: "fabber",
          op: "add",
          toBuild: "AdvancedEnergyGenerator",
          idToMod: "builders",
          value: "BasicNavalFabber",
        },
        {
          type: "fabber",
          op: "add",
          toBuild: "AdvancedRadar",
          idToMod: "builders",
          value: "BasicNavalFabber",
        },
        {
          type: "fabber",
          op: "add",
          toBuild: "TML",
          idToMod: "builders",
          value: "BasicNavalFabber",
        },
        {
          type: "fabber",
          op: "add",
          toBuild: "NukeSilo",
          idToMod: "builders",
          value: "BasicNavalFabber",
        },
        {
          type: "fabber",
          op: "add",
          toBuild: "UnitCannon",
          idToMod: "builders",
          value: "BasicNavalFabber",
        },
        {
          type: "fabber",
          op: "add",
          toBuild: "LongRangeArtillery",
          idToMod: "builders",
          value: "BasicNavalFabber",
        },
        {
          type: "fabber",
          op: "add",
          toBuild: "ControlModule",
          idToMod: "builders",
          value: "BasicNavalFabber",
        },
        {
          type: "fabber",
          op: "add",
          toBuild: "PlanetEngine",
          idToMod: "builders",
          value: "BasicNavalFabber",
        },
        {
          type: "fabber",
          op: "add",
          toBuild: "PlanetSplitter",
          idToMod: "builders",
          value: "BasicNavalFabber",
        },
      ]);
    },
    dull: function () {},
  };
});
