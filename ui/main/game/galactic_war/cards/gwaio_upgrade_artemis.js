define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Artemis Upgrade Tech",
    description:
      "!LOC:Artemis Upgrade Tech allows targeting of planetary units by the railgun platform.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_orbital_fighter_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: gwoUnit.artemis,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.artemisWeapon, "push", {
            target_layers: ["WL_LandHorizontal", "WL_WaterSurface", "WL_Air"],
          })
          .concat(
            gwoCard.mods(gwoUnit.artemisAmmo, "replace", {
              collision_check: "target",
            }),
            gwoCard.mods(gwoUnit.artemis, "push", {
              unit_types: "UNITTYPE_Heavy",
            })
          )
      );
    },
  });
});
