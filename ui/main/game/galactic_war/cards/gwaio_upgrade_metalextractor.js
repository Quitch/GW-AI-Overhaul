define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Metal Extractor Upgrade Tech",
    description:
      "!LOC:Metal Extractor Upgrade Tech increases the metal production of this basic economy structure by 25% but decreases its health by 50%.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_storage_compression_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_efficiency",
    requires: gwoUnit.metalExtractor,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.mods(gwoUnit.metalExtractor, "multiply", {
          "production.metal": 1.25,
          max_health: 0.5,
        })
      );
    },
  });
});
