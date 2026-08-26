define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Flak Upgrade Tech",
    description:
      "!LOC:Flak Upgrade Tech enables the targeting of land and surface naval units by anti-air defense.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_defense_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: gwoUnit.flak,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.flakWeapon, "push", {
            target_layers: ["WL_LandHorizontal", "WL_WaterSurface"],
            target_priorities: ["Mobile & (Land | Naval)"],
          })
          .concat(
            gwoCard.mods(gwoUnit.flak, "push", {
              unit_types: "UNITTYPE_SurfaceDefense",
            })
          )
      );
    },
  });
});
