define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], (gwoCard, gwoUnit, gwoGroup) => {
  const ADVANCED_BOT_FACTORY_ONLY = ["AdvancedBotFactory"];

  return {
    visible: () => true,
    describe: _.constant(
      gwoCard.withSlot(
        loc(
          "!LOC:Bot Factory Upgrade Tech enables the building of advanced units by basic bot manufacturing.",
        ),
      ),
    ),
    summarize: () => "!LOC:Bot Factory Upgrade Tech",
    icon: () =>
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_bot_factory_upgrade.png",
    audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_bot" }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.upgradeDeal(
        !inventory.hasCard("gwaio_start_rapid") &&
          gwoCard.hasUnit(inventory.units(), gwoUnit.botFactory),
      );
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
        advancedBotFabbers,
      );

      inventory.addUnits(advancedBotsWithoutFabbers);

      const advancedNonFabberBots = [
        "AdvancedArtilleryBot",
        "AdvancedAssaultBot",
        "NanoSwarm",
        "TMLBot",
      ];
      const unitBuilds = _.map(advancedNonFabberBots, (unit) => ({
        type: "factory",
        op: "append",
        toBuild: unit,
        idToMod: "builders",
        value: "BasicBotFactory",
        refId: "builders",
        refValue: ADVANCED_BOT_FACTORY_ONLY,
      }));
      const advancedCombatBots = [
        "AdvancedArtilleryBot",
        "AdvancedAssaultBot",
        "AdvancedBotCombatFabber",
        "NanoSwarm",
        "SupportCommander",
        "TMLBot",
      ];
      const unitPriority = _.map(advancedCombatBots, (unit) => ({
        type: "factory",
        op: "replace",
        toBuild: unit,
        idToMod: "priority",
        value: 97,
        refId: "builders",
        refValue: ADVANCED_BOT_FACTORY_ONLY,
      }));
      const aiMods = unitBuilds.concat(unitPriority);

      inventory.addMods(
        gwoCard.mods(gwoUnit.botFactory, "add", {
          buildable_types: " | (Bot & Mobile & FactoryBuild & Custom58)",
        }),
      );
      inventory.addAIMods(aiMods);
    },
    dull: function () {},
  };
});
