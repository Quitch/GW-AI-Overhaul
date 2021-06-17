define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Naval Factory Upgrade Tech enables the building of advanced units by basic naval manufacturing."
    ),
    summarize: _.constant("!LOC:Naval Factory Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_naval.png"
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
        gwaioFunctions.hasUnit("/pa/units/sea/naval_factory/naval_factory.json")
      )
        chance = 30;

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/sea/naval_factory/naval_factory.json",
          path: "buildable_types",
          op: "replace",
          value: "Naval & Mobile & FactoryBuild",
        },
      ]);

      inventory.addAIMods([
        {
          type: "factory",
          op: "append",
          toBuild: "AdvancedNavalFabber",
          idToMod: "builders",
          value: "BasicNavalFactory",
        },
        {
          type: "factory",
          op: "append",
          toBuild: "Battleship",
          idToMod: "builders",
          value: "BasicNavalFactory",
        },
        {
          type: "factory",
          op: "append",
          toBuild: "MissleShip",
          idToMod: "builders",
          value: "BasicNavalFactory",
        },
        {
          type: "factory",
          op: "append",
          toBuild: "MissileSub",
          idToMod: "builders",
          value: "BasicNavalFactory",
        },
        {
          type: "factory",
          op: "append",
          toBuild: "HoverShip",
          idToMod: "builders",
          value: "BasicNavalFactory",
        },
        {
          type: "factory",
          op: "append",
          toBuild: "DroneCarrier",
          idToMod: "builders",
          value: "BasicNavalFactory",
        },
        {
          type: "factory",
          op: "replace",
          toBuild: "BasicNavalFabber",
          idToMod: "priority",
          value: 220,
        },
        {
          type: "factory",
          op: "replace",
          toBuild: "Gunboat",
          idToMod: "priority",
          value: 210,
          refId: "name",
          refValue: "Gunboat - Intel",
        },
        {
          type: "factory",
          op: "replace",
          toBuild: "SeaScout",
          idToMod: "priority",
          value: 210,
        },
      ]);
    },
    dull: function () {},
  };
});
