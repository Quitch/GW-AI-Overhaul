define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Advanced Radar Satellite Upgrade Tech",
    description:
      "!LOC:Advanced Radar Satellite Upgrade Tech increases the vision and radar of the advanced orbital radar by 50%.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_intelligence_fabrication_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_efficiency",
    requires: gwoUnit.radarSatelliteAdvanced,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.mods(
          gwoUnit.radarSatelliteAdvanced,
          "multiply",
          gwoCard.eachPath(gwoCard.observerPaths(5, "radius"), 1.5)
        )
      );
    },
  });
});
