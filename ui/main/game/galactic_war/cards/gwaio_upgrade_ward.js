define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Ward Upgrade Tech",
    description:
      "!LOC:Ward Upgrade Tech causes the mobile anti-nuke to start fully charged.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_super_weapons_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_super_weapon",
    requires: gwoUnit.ward,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.mods(gwoUnit.wardWeapon, "replace", {
          start_fully_charged: true,
        })
      );
    },
  });
});
