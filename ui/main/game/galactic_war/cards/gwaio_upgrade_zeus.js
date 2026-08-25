define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Zeus Upgrade Tech",
    description:
      "!LOC:Zeus Upgrade Tech adds the ability for the lightning titan to move between planets.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_enable_titans_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_speed",
    requires: gwoUnit.zeus,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.mods(gwoUnit.zeus, "replace", {
          system_velocity_multiplier: 30,
          gravwell_velocity_multiplier: 10,
          "navigation.inter_planetary_type": "system",
        })
      );
    },
  });
});
