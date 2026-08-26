define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Laser Defense Tower Upgrade Tech",
    description:
      "!LOC:Laser Defense Tower Upgrade Tech increases the range of the turret by 50%.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_turret_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_combat",
    requires: gwoUnit.laserDefenseTower,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.mods(gwoUnit.laserDefenseTowerWeapon, "multiply", {
          max_range: 1.5,
        })
      );
    },
  });
});
