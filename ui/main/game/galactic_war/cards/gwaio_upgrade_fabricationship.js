define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoUnit, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Fabrication Ship Upgrade Tech enables the building of advanced structures by the basic naval fabricator."
    ),
    summarize: _.constant("!LOC:Fabrication Ship Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_metal_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_sea",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), gwoUnit.navalFabber)) {
        chance = 30;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addUnits(gwoGroup.starterUnitsAdvanced);

      inventory.addMods([
        {
          file: gwoUnit.navalFabber,
          path: "buildable_types",
          op: "add",
          value: " | (Naval & Structure & Advanced | FabAdvBuild) & Custom58",
        },
      ]);

      var units = [
        "AdvancedAirDefense",
        "AdvancedLandDefense",
        "AdvancedNavalDefense",
        "AdvancedRadar",
        "AntiNukeSilo",
        "ControlModule",
        "LongRangeArtillery",
        "NukeSilo",
        "PlanetEngine",
        "PlanetSplitter",
        "TeslaGunship",
        "TML",
        "UnitCannon",
      ];
      var aiMods = _.map(units, function (unit) {
        return {
          type: "fabber",
          op: "append",
          toBuild: unit,
          idToMod: "builders",
          value: "BasicNavalFabber",
        };
      });
      inventory.addAIMods(aiMods);
    },
    dull: function () {},
  };
});
