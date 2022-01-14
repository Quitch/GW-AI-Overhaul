define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoUnit, gwoGroup) {
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
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        !inventory.hasCard("gwaio_start_rapid") &&
        gwoCard.hasUnit(inventory.units(), gwoUnit.botFactory)
      ) {
        chance = 60;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addUnits(gwoGroup.botsAdvancedMobile);

      inventory.addMods([
        {
          file: gwoUnit.botFactory,
          path: "buildable_types",
          op: "add",
          value: " | (Bot & Mobile & FactoryBuild)",
        },
      ]);

      var units = [
        "AdvancedArtilleryBot",
        "AdvancedAssaultBot",
        "AdvancedBotCombatFabber",
        "NanoSwarm",
        "SupportCommander",
        "TMLBot",
      ];
      var aiMods = _.flatten(
        _.map(units, function (unit) {
          return [
            {
              type: "factory",
              op: "append",
              toBuild: unit,
              idToMod: "builders",
              value: "BasicBotFactory",
              refId: "builders",
              refValue: ["AdvancedBotFactory"], // avoid Unit Cannon builds
            },
            {
              type: "factory",
              op: "replace",
              toBuild: unit,
              idToMod: "priority",
              value: 97,
              refId: "builders",
              refValue: ["AdvancedBotFactory"], // avoid Unit Cannon builds
            },
          ];
        })
      );
      var fabbers = [
        "AdvancedBotCombatFabber",
        "AdvancedBotFabber",
        "SupportCommander",
      ];
      _.forEach(fabbers, function (fabber) {
        aiMods.push({
          type: "factory",
          op: "new",
          toBuild: fabber,
          idToMod: "", // add to every test array
          value: {
            test_type: "HaveEcoForAdvanced",
            boolean: true,
          },
        });
      });
      aiMods.push({
        type: "factory",
        op: "append",
        toBuild: "AdvancedBotFabber",
        idToMod: "builders",
        value: "BasicBotFactory",
      });
      inventory.addAIMods(aiMods);
    },
    dull: function () {
      //empty
    },
  };
});
