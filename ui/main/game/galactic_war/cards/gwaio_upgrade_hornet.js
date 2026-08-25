define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Hornet Upgrade Tech",
    description:
      "!LOC:Hornet Upgrade Tech adds splash damage to the tactical bomber's attacks.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_combat_air_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: gwoUnit.hornet,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.mods(gwoUnit.hornetAmmo, "replace", {
          splash_damage: 1000,
          splash_radius: 12,
        })
      );
    },
  });
});
