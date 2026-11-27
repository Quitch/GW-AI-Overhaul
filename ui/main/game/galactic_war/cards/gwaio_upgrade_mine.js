define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Mine Upgrade Tech",
    description:
      "!LOC:Mine Upgrade Tech allows mines to explode without self-destructing. Mines take 10 seconds to re-arm.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_turret_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: gwoUnit.landMine,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.landMineWeapon, "replace", { self_destruct: false })
          .concat(
            gwoCard.mods(gwoUnit.landMineWeapon, "multiply", {
              rate_of_fire: 0.02,
            })
          )
      );
    },
  });
});
