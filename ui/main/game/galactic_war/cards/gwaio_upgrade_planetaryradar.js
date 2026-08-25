define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Planetary Radar Upgrade Tech",
    describe: function () {
      if (gwoCard.isEnglish()) {
        return gwoCard.withSlot(
          loc(
            "!LOC:Planetary Radar Upgrade Tech increases the vision of the planetary radar to match its radar."
          )
        );
      }
      return gwoCard.withSlot(
        loc(
          "!LOC:Planetary Upgrade Tech increases the vision of the planetary radar to match its radar."
        )
      );
    },
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_intelligence_fabrication_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_efficiency",
    available: function (inventory) {
      return inventory.hasCard("gwaio_enable_planetaryradar");
    },
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.mods(gwoUnit.deepSpaceOrbitalRadar, "multiply", {
          "recon.observer.items.0.radius": 33.33,
          "recon.observer.items.1.radius": 33.33,
          "recon.observer.items.2.radius": 8.3325,
        })
      );
    },
  });
});
