define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioCards, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Bot Factory Upgrade Tech enables the building of advanced units by basic bot manufacturing."
    ),
    summarize: _.constant("!LOC:Bot Factory Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_bot_factory_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_bot",
      };
    },
    getContext: gwaioCards.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        gwaioCards.hasUnit(gwaioUnits.botFactory) &&
        !inventory.hasCard("gwaio_start_rapid")
      ) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.botFactory,
          path: "buildable_types",
          op: "add",
          value: " | (Bot & Mobile & FactoryBuild)",
        },
      ]);

      inventory.addAIMods([
        {
          type: "factory",
          op: "append",
          toBuild: "AdvancedBotFabber",
          idToMod: "builders",
          value: "BasicBotFactory",
        },
        {
          type: "factory",
          op: "new",
          toBuild: "AdvancedBotFabber",
          idToMod: "", // add to every test array
          value: {
            test_type: "HaveEcoForAdvanced",
            boolean: true,
          },
        },
        {
          type: "factory",
          op: "append",
          toBuild: "AdvancedAssaultBot",
          idToMod: "builders",
          value: "BasicBotFactory",
          refId: "priority",
          refValue: 199, // avoid Unit Cannon builds
        },
        {
          type: "factory",
          op: "append",
          toBuild: "AdvancedArtilleryBot",
          idToMod: "builders",
          value: "BasicBotFactory",
        },
        {
          type: "factory",
          op: "append",
          toBuild: "TMLBot",
          idToMod: "builders",
          value: "BasicBotFactory",
        },
        {
          type: "factory",
          op: "append",
          toBuild: "NanoSwarm",
          idToMod: "builders",
          value: "BasicBotFactory",
          refId: "priority",
          refValue: 199, // avoid Unit Cannon builds
        },
        {
          type: "factory",
          op: "replace",
          toBuild: "AdvancedAssaultBot",
          idToMod: "priority",
          value: 97,
          refId: "priority",
          refValue: 199, // avoid Unit Cannon builds
        },
        {
          type: "factory",
          op: "replace",
          toBuild: "AdvancedBotCombatFabber",
          idToMod: "priority",
          value: 97,
        },
        {
          type: "factory",
          op: "replace",
          toBuild: "AdvancedArtilleryBot",
          idToMod: "priority",
          value: 97,
        },
        {
          type: "factory",
          op: "replace",
          toBuild: "TMLBot",
          idToMod: "priority",
          value: 97,
        },
        {
          type: "factory",
          op: "replace",
          toBuild: "SupportCommander",
          idToMod: "priority",
          value: 97,
        },
        {
          type: "factory",
          op: "replace",
          toBuild: "NanoSwarm",
          idToMod: "priority",
          value: 97,
          refId: "priority",
          refValue: 199, // avoid Unit Cannon builds
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
