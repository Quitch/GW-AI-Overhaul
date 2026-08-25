define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoAI, gwoCard, gwoUnit, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      gwoCard.withSlot(
        loc(
          "!LOC:Fabrication Aircraft Upgrade Tech enables the building of advanced structures by the basic air fabricator."
        )
      )
    ),
    summarize: _.constant("!LOC:Fabrication Aircraft Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_metal_upgrade.png"
    ),
    audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_air" }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.upgradeDeal(
        gwoCard.hasUnit(inventory.units(), gwoUnit.airFabber)
      );
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addUnits(gwoGroup.starterUnitsAdvanced);

      inventory.addMods(
        gwoCard.mods(gwoUnit.airFabber, "add", {
          buildable_types:
            " | (Land & Structure & Advanced - Factory | FabAdvBuild) & Custom58",
        })
      );

      var units = gwoAI.advancedStructureBuilds.concat(
        inventory.hasCard("gwc_enable_titans") ? ["PlanetSplitter"] : []
      );
      inventory.addAIMods(
        gwoAI.builderAppendMods("fabber", units, "BasicAirFabber")
      );
    },
    dull: function () {},
  };
});
