define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Kraken Upgrade Tech",
    description:
      "!LOC:Kraken Upgrade Tech increases the range of the advanced submarine's missiles by 200%.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_naval_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_combat",
    requires: gwoUnit.kraken,
    chance: 30,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.mods(gwoUnit.krakenMissile, "multiply", {
          max_range: 3,
        })
      );
    },
  });
});
