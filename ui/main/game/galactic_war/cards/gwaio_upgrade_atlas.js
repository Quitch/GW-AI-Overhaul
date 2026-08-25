define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Atlas Upgrade Tech",
    description:
      "!LOC:Atlas Upgrade Tech doubles the health of the seismic titan.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_enable_titans_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_armor",
    requires: gwoUnit.atlas,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.mods(gwoUnit.atlas, "multiply", {
          max_health: 2,
        })
      );
    },
  });
});
