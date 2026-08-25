define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoUnit, gwoGroup) {
  return gwoCard.upgradeCard({
    name: "!LOC:Advanced Bot Factory Upgrade Tech",
    description:
      "!LOC:Advanced Bot Factory Upgrade Tech decreases advanced bot unit costs by 25% but also decreases the factory's health by 50%.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_bot_combat_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_bot",
    requires: gwoUnit.botFactoryAdvanced,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard
          .flatMapMods(gwoGroup.botsAdvancedMobile, "multiply", {
            build_metal_cost: 0.75,
          })
          .concat(
            gwoCard.mods(gwoUnit.botFactoryAdvanced, "multiply", {
              max_health: 0.5,
            })
          )
      );
    },
  });
});
