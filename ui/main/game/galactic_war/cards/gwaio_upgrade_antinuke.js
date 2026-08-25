define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Anti-Nuke Launcher Upgrade Tech",
    description:
      "!LOC:Anti-Nuke Launcher Upgrade Tech halves the cost of SR-24 Shield Missile Defense missiles.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_super_weapons_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_super_weapon",
    requires: gwoUnit.antiNukeLauncher,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.mods(gwoUnit.antiNukeLauncherAmmo, "multiply", {
          build_metal_cost: 0.5,
        })
      );
    },
  });
});
