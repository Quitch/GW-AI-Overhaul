define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Halley Upgrade Tech",
    description:
      "!LOC:Halley Upgrade Tech doubles the health of the delta V engine and halves its cost.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_super_weapons_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_armor",
    requires: gwoUnit.halley,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.mods(gwoUnit.halley, "multiply", {
          max_health: 2,
          build_metal_cost: 0.5,
        })
      );
    },
  });
});
