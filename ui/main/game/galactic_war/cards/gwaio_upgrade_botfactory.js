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
        loc("!LOC:Adds a new slot for another technology.")
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
      return {
        params: {
          allowOverflow: true,
        },
        chance: chance,
      };
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);

      const advancedBotFabbers = [
        gwoUnit.colonel,
        gwoUnit.mend,
        gwoUnit.botFabberAdvanced,
      ];
      const advancedBotsWithoutFabbers = _.xor(
        gwoGroup.botsAdvancedMobile,
        advancedBotFabbers
      );

      inventory.addUnits(advancedBotsWithoutFabbers);

      const advancedNonFabberBots = [
        "AdvancedArtilleryBot",
        "AdvancedAssaultBot",
        "NanoSwarm",
        "TMLBot",
      ];
      const unitBuilds = _.map(advancedNonFabberBots, function (unit) {
        return {
          type: "factory",
          op: "append",
          toBuild: unit,
          idToMod: "builders",
          value: "BasicBotFactory",
          refId: "builders",
          refValue: ["AdvancedBotFactory"], // avoid Unit Cannon builds
        };
      });
      // We apply AI priority changes to ALL combat units so that even
      // unaffected ones will be handled properly by T2 factories
      const advancedCombatBots = [
        "AdvancedArtilleryBot",
        "AdvancedAssaultBot",
        "AdvancedBotCombatFabber",
        "NanoSwarm",
        "SupportCommander",
        "TMLBot",
      ];
      const unitPriority = _.map(advancedCombatBots, function (unit) {
        return {
          type: "factory",
          op: "replace",
          toBuild: unit,
          idToMod: "priority",
          value: 97,
          refId: "builders",
          refValue: ["AdvancedBotFactory"], // avoid Unit Cannon builds
        };
      });
      const aiMods = unitBuilds.concat(unitPriority);

      inventory.addMods([
        {
          file: gwoUnit.botFactory,
          path: "buildable_types",
          op: "add",
          value: " | (Bot & Mobile & FactoryBuild & Custom58)",
        },
      ]);
      inventory.addAIMods(aiMods);
    },
    dull: function () {},
  };
});
