define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Metal Storage Upgrade Tech",
    description:
      "!LOC:Metal Storage Upgrade Tech increases the amount of metal storage by 300%.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_storage_compression_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_economy",
    requires: gwoUnit.metalStorage,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.mods(gwoUnit.metalStorage, "multiply", { "storage.metal": 4 })
      );
    },
  });
});
