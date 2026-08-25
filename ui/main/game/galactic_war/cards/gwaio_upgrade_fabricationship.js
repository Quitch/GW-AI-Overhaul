define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoAI, gwoCard, gwoUnit, gwoGroup) {
  return gwoCard.upgradeCard({
    name: "!LOC:Fabrication Ship Upgrade Tech",
    description:
      "!LOC:Fabrication Ship Upgrade Tech enables the building of advanced structures by the basic naval fabricator.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_metal_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_sea",
    requires: gwoUnit.navalFabber,
    chance: function (inventory) {
      return gwoCard.navalWeight(inventory, 30);
    },
    buff: function (inventory) {
      inventory.addUnits(gwoGroup.starterUnitsAdvanced);

      inventory.addMods(
        gwoCard.mods(gwoUnit.navalFabber, "add", {
          buildable_types:
            " | (Naval & Structure & Advanced | FabAdvBuild) & Custom58",
        })
      );

      var units = gwoAI.advancedStructureBuilds.concat(
        inventory.hasCard("gwc_enable_titans") ? ["PlanetSplitter"] : []
      );
      inventory.addAIMods(
        gwoAI.builderAppendMods("fabber", units, "BasicNavalFabber")
      );
    },
  });
});
