define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Umbrella Upgrade Tech",
    description:
      "!LOC:Umbrella Upgrade Tech enables the targeting of land and surface naval units by anti-orbital defenses.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_turret_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: gwoUnit.umbrella,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.umbrella, "push", {
            unit_types: "UNITTYPE_SurfaceDefense",
          })
          .concat(
            gwoCard.mods(gwoUnit.umbrellaWeapon, "push", {
              target_layers: ["WL_LandHorizontal", "WL_WaterSurface"],
            }),
            gwoCard.mods(gwoUnit.umbrellaAmmo, "replace", { turn_rate: 1000 })
          )
      );
    },
  });
});
