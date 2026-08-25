define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Advanced Fabrication Ship Upgrade Tech",
    description:
      "!LOC:Advanced Fabrication Ship Upgrade Tech changes the advanced naval fabricator into a hover unit, allowing it to cross land and lava.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_metal_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_sea",
    requires: gwoUnit.navalFabberAdvanced,
    chance: function (inventory) {
      return gwoCard.navalWeight(inventory, 30);
    },
    buff: function (inventory) {
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.navalFabberAdvanced, "push", {
            unit_types: "UNITTYPE_Hover",
          })
          .concat(
            gwoCard.mods(gwoUnit.navalFabberAdvanced, "replace", {
              "navigation.type": "hover",
            })
          )
      );
    },
  });
});
