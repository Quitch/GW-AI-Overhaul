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
    audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_bot" }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.upgradeDeal(
        !inventory.hasCard("gwaio_start_rapid") &&
          gwoCard.hasUnit(inventory.units(), gwoUnit.botFactory)
      );
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);

      var advancedBotFabbers = [
        gwoUnit.colonel,
        gwoUnit.mend,
        gwoUnit.botFabberAdvanced,
      ];
      var advancedBotsWithoutFabbers = _.xor(
        gwoGroup.botsAdvancedMobile,
        advancedBotFabbers
      );

      inventory.addUnits(advancedBotsWithoutFabbers);

      var advancedNonFabberBots = [
        "AdvancedArtilleryBot",
        "AdvancedAssaultBot",
        "NanoSwarm",
        "TMLBot",
      ];
      var unitBuilds = _.map(advancedNonFabberBots, function (unit) {
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
      var advancedCombatBots = [
        "AdvancedArtilleryBot",
        "AdvancedAssaultBot",
        "AdvancedBotCombatFabber",
        "NanoSwarm",
        "SupportCommander",
        "TMLBot",
      ];
      var unitPriority = _.map(advancedCombatBots, function (unit) {
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
      var aiMods = unitBuilds.concat(unitPriority);

      inventory.addMods(
        gwoCard.mods(gwoUnit.botFactory, "add", {
          buildable_types: " | (Bot & Mobile & FactoryBuild & Custom58)",
        })
      );
      inventory.addAIMods(aiMods);
    },
    dull: function () {},
  };
});
