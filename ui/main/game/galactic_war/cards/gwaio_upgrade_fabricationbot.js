define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioCards, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Fabrication Bot Upgrade Tech enables the building of advanced structures by the basic bot fabricator."
    ),
    summarize: _.constant("!LOC:Fabrication Bot Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_metal_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_bot",
      };
    },
    getContext: gwaioCards.getContext,
    deal: function () {
      var chance = 0;
      if (
        gwaioCards.hasUnit(gwaioUnits.botFactory) &&
        gwaioCards.hasUnit(gwaioUnits.botFabber)
      ) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.botFabber,
          path: "buildable_types",
          op: "add",
          value: " | Land & Structure & Advanced - Factory | FabAdvBuild",
        },
      ]);

      inventory.addAIMods([
        {
          type: "fabber",
          op: "append",
          toBuild: "AdvancedNavalDefense",
          idToMod: "builders",
          value: "BasicBotFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "AdvancedAirDefense",
          idToMod: "builders",
          value: "BasicBotFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "AdvancedLandDefense",
          idToMod: "builders",
          value: "BasicBotFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "AntiNukeSilo",
          idToMod: "builders",
          value: "BasicBotFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "AdvancedRadar",
          idToMod: "builders",
          value: "BasicBotFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "TML",
          idToMod: "builders",
          value: "BasicBotFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "NukeSilo",
          idToMod: "builders",
          value: "BasicBotFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "UnitCannon",
          idToMod: "builders",
          value: "BasicBotFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "LongRangeArtillery",
          idToMod: "builders",
          value: "BasicBotFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "ControlModule",
          idToMod: "builders",
          value: "BasicBotFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "PlanetEngine",
          idToMod: "builders",
          value: "BasicBotFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "PlanetSplitter",
          idToMod: "builders",
          value: "BasicBotFabber",
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "SeismicBot",
          idToMod: "builders",
          value: "BasicBotFabber",
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
