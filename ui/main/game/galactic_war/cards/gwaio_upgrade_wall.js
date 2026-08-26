define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Wall Upgrade Tech",
    description: "!LOC:Wall Upgrade Tech increases the health of walls by 50%.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_turret_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_armor",
    requires: gwoUnit.wall,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.mods(gwoUnit.wall, "multiply", {
          max_health: 1.5,
        })
      );
    },
  });
});
