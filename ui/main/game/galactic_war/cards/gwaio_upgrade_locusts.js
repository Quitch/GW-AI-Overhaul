define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Locusts Upgrade Tech",
    description: "!LOC:Locusts Upgrade Tech adds splash damage to nanoswarms.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_bot_combat_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_combat",
    requires: gwoUnit.locusts,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.mods(gwoUnit.locustsAmmo, "add", {
          splash_damage: 20,
          splash_radius: 20,
          full_damage_splash_radius: 5,
        })
      );
    },
  });
});
