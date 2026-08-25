define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Advanced Fabrication Vehicle Upgrade Tech",
    description:
      "!LOC:Advanced Fabrication Vehicle Upgrade Tech increases the build range of the advanced vehicle fabricator by 150%.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_metal_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_vehicle",
    requires: gwoUnit.vehicleFabberAdvanced,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.mods(gwoUnit.vehicleFabberAdvancedBuildArm, "multiply", {
          max_range: 2.5,
        })
      );
    },
  });
});
