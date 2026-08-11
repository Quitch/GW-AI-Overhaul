define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoUnit, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      gwoCard.withSlot(
        loc(
          "!LOC:Fabrication Ship Upgrade Tech enables the building of advanced structures by the basic naval fabricator."
        )
      )
    ),
    summarize: _.constant("!LOC:Fabrication Ship Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_metal_upgrade.png"
    ),
    audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_sea" }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.upgradeDeal(
        gwoCard.hasUnit(inventory.units(), gwoUnit.navalFabber),
        gwoCard.navalWeight(inventory, 30)
      );
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addUnits(gwoGroup.starterUnitsAdvanced);

      inventory.addMods(
        gwoCard.mods(gwoUnit.navalFabber, "add", {
          buildable_types:
            " | (Naval & Structure & Advanced | FabAdvBuild) & Custom58",
        })
      );

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
        "TML",
        "UnitCannon",
      ];
      // Titan Tech is the only card that puts a Ragnarok in the army.
      if (inventory.hasCard("gwc_enable_titans")) {
        units.push("PlanetSplitter");
      }
      var aiMods = _.map(units, function (unit) {
        return {
          type: "fabber",
          op: "append",
          toBuild: unit,
          idToMod: "builders",
          value: "BasicNavalFabber",
          matchAll: true,
        };
      });
      inventory.addAIMods(aiMods);
    },
    dull: function () {},
  };
});
