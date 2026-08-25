define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoAI, gwoCard, gwoUnit, gwoGroup) {
  return gwoCard.upgradeCard({
    name: "!LOC:Fabrication Vehicle Upgrade Tech",
    description:
      "!LOC:Fabrication Vehicle Upgrade Tech enables the building of advanced structures by the basic vehicle fabricator.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_metal_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_vehicle",
    requires: gwoUnit.vehicleFabber,
    buff: function (inventory) {
      inventory.addUnits(gwoGroup.starterUnitsAdvanced);

      inventory.addMods(
        gwoCard.mods(gwoUnit.vehicleFabber, "add", {
          buildable_types:
            " | (Structure & Land & Advanced - Factory | FabAdvBuild) & Custom58",
        })
      );

      var units = gwoAI.advancedStructureBuilds.concat(
        inventory.hasCard("gwc_enable_titans") ? ["PlanetSplitter"] : []
      );
      inventory.addAIMods(
        gwoAI.builderAppendMods("fabber", units, "BasicVehicleFabber")
      );
    },
  });
});
