define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioFunctions, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Naval Factory Upgrade Tech enables the building of advanced units by basic naval manufacturing."
    ),
    summarize: _.constant("!LOC:Naval Factory Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_naval_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_sea",
      };
    },
    getContext: gwaioFunctions.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        gwaioFunctions.hasUnit(gwaioUnits.navalFactory) &&
        !inventory.hasCard("gwaio_start_rapid")
      ) {
        chance = 30;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.navalFactory,
          path: "buildable_types",
          op: "add",
          value: " | (Naval & Mobile & FactoryBuild)",
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
          op: "new",
          toBuild: "AdvancedNavalFabber",
          idToMod: "", // add to every test array
          value: {
            test_type: "HaveEcoForAdvanced",
            boolean: true,
          },
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
          toBuild: "Battleship",
          idToMod: "priority",
          value: 97,
        },
        {
          type: "factory",
          op: "replace",
          toBuild: "MissleShip",
          idToMod: "priority",
          value: 97,
        },
        {
          type: "factory",
          op: "replace",
          toBuild: "MissileSub",
          idToMod: "priority",
          value: 97,
        },
        {
          type: "factory",
          op: "replace",
          toBuild: "HoverShip",
          idToMod: "priority",
          value: 97,
        },
        {
          type: "factory",
          op: "replace",
          toBuild: "DroneCarrier",
          idToMod: "priority",
          value: 97,
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
