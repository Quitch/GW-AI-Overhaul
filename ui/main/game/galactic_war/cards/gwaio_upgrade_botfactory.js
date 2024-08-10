define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoUnit, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Bot Factory Upgrade Tech enables the building of advanced units by basic bot manufacturing."
      ) +
        "<br> <br>" +
        loc("!LOC:Does not use a Data Bank.")
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
      inventory.maxCards(inventory.maxCards() + 1);
      const newUnits = gwoGroup.starterUnitsAdvanced.concat(
        gwoGroup.botsAdvancedMobile
      );
      inventory.addUnits(newUnits);

      inventory.addMods([
        {
          file: gwoUnit.botFactory,
          path: "buildable_types",
          op: "add",
          value: " | (Bot & Mobile & FactoryBuild & Custom58)",
        },
      ]);

      const units = [
        "AdvancedArtilleryBot",
        "AdvancedAssaultBot",
        "AdvancedBotCombatFabber",
        "NanoSwarm",
        "SupportCommander",
        "TMLBot",
      ];
      const aiMods = _.flatten(
        _.map(units, function (unit) {
          return [
            {
              type: "factory",
              op: "replace",
              toBuild: unit,
              idToMod: "priority",
              value: 97,
              refId: "builders",
              refValue: ["AdvancedBotFactory"], // avoid Unit Cannon builds
            },
            {
              type: "factory",
              op: "append",
              toBuild: unit,
              idToMod: "builders",
              value: "BasicBotFactory",
              refId: "builders",
              refValue: ["AdvancedBotFactory"], // avoid Unit Cannon builds
            },
          ];
        })
      );
      const fabbers = [
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
    dull: function () {},
  };
});
