define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioFunctions, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Air Factory Upgrade Tech enables the building of advanced units by basic air manufacturing."
    ),
    summarize: _.constant("!LOC:Air Factory Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_combat_air_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_air",
      };
    },
    getContext: gwaioFunctions.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        gwaioFunctions.hasUnit(gwaioUnits.airFactory) &&
        !inventory.hasCard("gwaio_start_rapid")
      ) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.airFactory,
          path: "buildable_types",
          op: "add",
          value: " | (Air & Mobile & FactoryBuild)",
        },
      ]);

      inventory.addAIMods([
        {
          type: "factory",
          op: "load",
          value: "gwaio_upgrade_airfactory.json",
        },
        {
          type: "factory",
          op: "append",
          toBuild: "AdvancedAirFabber",
          idToMod: "builders",
          value: "BasicAirFactory",
        },
        {
          type: "factory",
          op: "new",
          toBuild: "AdvancedAirFabber",
          idToMod: "", // add to every test array
          value: {
            test_type: "HaveEcoForAdvanced",
            boolean: true,
          },
        },
        {
          type: "factory",
          op: "append",
          toBuild: "AdvancedBomber",
          idToMod: "builders",
          value: "BasicAirFactory",
        },
        {
          type: "factory",
          op: "append",
          toBuild: "AdvancedGunship",
          idToMod: "builders",
          value: "BasicAirFactory",
        },
        {
          type: "factory",
          op: "append",
          toBuild: "AdvancedFighter",
          idToMod: "builders",
          value: "BasicAirFactory",
        },
        {
          type: "factory",
          op: "append",
          toBuild: "Strafer",
          idToMod: "builders",
          value: "BasicAirFactory",
        },
        {
          type: "factory",
          op: "replace",
          toBuild: "AdvancedBomber",
          idToMod: "priority",
          value: 97,
        },
        {
          type: "factory",
          op: "replace",
          toBuild: "AdvancedGunship",
          idToMod: "priority",
          value: 97,
        },
        {
          type: "factory",
          op: "replace",
          toBuild: "AdvancedFighter",
          idToMod: "priority",
          value: 97,
        },
        {
          type: "factory",
          op: "replace",
          toBuild: "Strafer",
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
