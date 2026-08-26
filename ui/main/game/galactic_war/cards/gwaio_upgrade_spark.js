define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Spark Upgrade Tech",
    description:
      "!LOC:Spark Upgrade Tech increases the tesla bot's splash damage radius by 200%.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_bot_combat_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: gwoUnit.spark,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.mods(gwoUnit.sparkAmmo, "multiply", {
          splash_radius: 3,
          full_damage_splash_radius: 3,
        })
      );
    },
  });
});
