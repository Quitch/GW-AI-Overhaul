define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Advanced Energy Plant Upgrade Tech",
    description:
      "!LOC:Advanced Energy Plant Upgrade Tech increases the energy production of this advanced economy structure by 25% but decreases its health by 50%.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_storage_compression_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_efficiency",
    requires: gwoUnit.energyPlantAdvanced,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.mods(gwoUnit.energyPlantAdvanced, "multiply", {
          "production.energy": 1.25,
          max_health: 0.5,
        })
      );
    },
  });
});
