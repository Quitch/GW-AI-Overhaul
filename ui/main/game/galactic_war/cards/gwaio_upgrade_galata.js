define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Galata Upgrade Tech",
    description:
      "!LOC:Galata Upgrade Tech enables the targeting of land and surface naval units by anti-air defense.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_turret_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: gwoUnit.galata,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.galata, "push", {
            unit_types: "UNITTYPE_SurfaceDefense",
          })
          .concat(
            gwoCard.mods(gwoUnit.galataWeapon, "push", {
              target_layers: ["WL_LandHorizontal", "WL_WaterSurface"],
              target_priorities: ["Mobile & (Land | Naval)"],
            }),
            gwoCard.mods(gwoUnit.galataAmmo, "replace", {
              armor_damage_map: {},
            })
          )
      );
    },
  });
});
