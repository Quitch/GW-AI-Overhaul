define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Nuclear Missile Launcher Upgrade Tech",
    description:
      "!LOC:Nuclear Missile Launcher Upgrade Tech increases the damage dealt to commanders and orbital from the LR-96 Pacifier Nuclear Missiles by 200%.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_super_weapons_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_super_weapon",
    requires: gwoUnit.nukeLauncher,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.mods(gwoUnit.nukeLauncherAmmo, "multiply", {
          "armor_damage_map.AT_Commander": 3,
          "armor_damage_map.AT_Orbital": 3,
        })
      );
    },
  });
});
