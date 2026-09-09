define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Planetary Radar Upgrade Tech",
    description:
      "!LOC:Planetary Radar Upgrade Tech increases the vision of the planetary radar to match its radar.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_intelligence_fabrication_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_efficiency",
    available: function (inventory) {
      return inventory.hasCard("gwaio_enable_planetaryradar");
    },
    buff: function (inventory) {
      // Factors of the enable card's radii, not a replace to 9999: buffs run in
      // module-load order, and a replace here could land before the enable
      // card's whole-array replace and be wiped by it. multiply is a later op
      // bucket, so it always applies after. See specs.md, "The op table".
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
