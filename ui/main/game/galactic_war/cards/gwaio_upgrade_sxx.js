define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:SXX-1304 Laser Platform Upgrade Tech",
    description:
      "!LOC:SXX-1304 Laser Platform Upgrade Tech removes the delay between orbital laser platforms arriving at a planet and responding to orders.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_orbital_fighter_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_speed",
    requires: gwoUnit.sxx,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.mods(gwoUnit.sxx, "replace", {
          planetary_arrival_cooldown_time: 0,
        })
      );
    },
  });
});
