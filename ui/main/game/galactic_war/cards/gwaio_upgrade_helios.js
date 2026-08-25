define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Helios Upgrade Tech",
    description:
      "!LOC:Helios Upgrade Tech removes the delay between the invasion titan arriving at a planet and responding to orders and increases its health by 50%.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_enable_titans_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_armor",
    requires: gwoUnit.helios,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.helios, "replace", {
            planetary_arrival_cooldown_time: 0,
          })
          .concat(gwoCard.mods(gwoUnit.helios, "multiply", { max_health: 1.5 }))
      );
    },
  });
});
