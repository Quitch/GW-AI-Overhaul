define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Radar Jamming Station Upgrade Tech",
    description:
      "!LOC:Radar Jamming Station Upgrade Tech doubles the jamming radius of the radar jammer.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_intelligence_fabrication_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_efficiency",
    requires: gwoUnit.radarJammingStation,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.mods(gwoUnit.radarJammingStation, "multiply", {
          "recon.observer.items.2.radius": 2,
        })
      );
    },
  });
});
