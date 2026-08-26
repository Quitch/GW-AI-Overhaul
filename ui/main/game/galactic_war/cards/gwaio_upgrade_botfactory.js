define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoUnit, gwoGroup) {
  var ADVANCED_BOT_FACTORY_ONLY = ["AdvancedBotFactory"];

  return gwoCard.upgradeCard({
    name: "!LOC:Bot Factory Upgrade Tech",
    description:
      "!LOC:Bot Factory Upgrade Tech enables the building of advanced units by basic bot manufacturing.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_bot_factory_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_bot",
    requires: gwoUnit.botFactory,
    unless: "gwaio_start_rapid",
    buff: function (inventory) {
      var advancedBotFabbers = [
        gwoUnit.colonel,
        gwoUnit.mend,
        gwoUnit.botFabberAdvanced,
      ];
      var advancedBotsWithoutFabbers = _.difference(
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
          refValue: ADVANCED_BOT_FACTORY_ONLY,
        };
      });
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
          refValue: ADVANCED_BOT_FACTORY_ONLY,
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
  });
});
