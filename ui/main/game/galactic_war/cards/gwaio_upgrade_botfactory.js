define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Bot Factory Upgrade Tech enables the building of advanced units by basic bot manufacturing."
    ),
    summarize: _.constant("!LOC:Bot Factory Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_bot_factory.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_bot",
      };
    },
    getContext: function (galaxy) {
      return {
        totalSize: galaxy.stars().length,
      };
    },
    deal: function () {
      var chance = 0;
      if (gwaioFunctions.hasUnit("/pa/units/land/bot_factory/bot_factory.json"))
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/land/bot_factory/bot_factory.json",
          path: "buildable_types",
          op: "replace",
          value: "Bot & Mobile & FactoryBuild",
        },
      ]);

      inventory.addAIMods([
        {
          type: "factory",
          op: "append",
          toBuild: "AdvancedAssaultBot",
          idToMod: "builders",
          value: "BasicBotFactory",
          refId: "priority",
          refValue: 199,
        },
        {
          type: "factory",
          op: "append",
          toBuild: "AdvancedBotCombatFabber",
          idToMod: "builders",
          value: "BasicBotFactory",
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
          toBuild: "SupportCommander",
          idToMod: "builders",
          value: "BasicBotFactory",
        },
        {
          type: "factory",
          op: "append",
          toBuild: "UberSupportCommander",
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
          refValue: 199,
        },
        {
          type: "factory",
          op: "replace",
          toBuild: "AdvancedAssaultBot",
          idToMod: "priority",
          value: 97,
          refId: "priority",
          refValue: 199,
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
          value: 100,
        },
        {
          type: "factory",
          op: "replace",
          toBuild: "UberSupportCommander",
          idToMod: "priority",
          value: 100,
        },
        {
          type: "factory",
          op: "replace",
          toBuild: "NanoSwarm",
          idToMod: "priority",
          value: 97,
          refId: "priority",
          refValue: 199,
        },
      ]);
    },
    dull: function () {},
  };
});
