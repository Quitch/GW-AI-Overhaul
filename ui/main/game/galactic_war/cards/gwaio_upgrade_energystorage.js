define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Energy Storage Upgrade Tech",
    description:
      "!LOC:Energy Storage Upgrade Tech increases the amount of energy storage by 300%.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_storage_compression_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_economy",
    requires: gwoUnit.energyStorage,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.mods(gwoUnit.energyStorage, "multiply", { "storage.energy": 4 })
      );
    },
  });
});
