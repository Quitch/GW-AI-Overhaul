define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Angel Upgrade Tech",
    description:
      "!LOC:Angel Upgrade Tech enables the targeting of enemy units and structures by the support platform's interception beam.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_combat_air_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: gwoUnit.angel,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.angel, "push", {
            command_caps: ["ORDER_Attack"],
            unit_types: ["UNITTYPE_Gunship", "UNITTYPE_Offense"],
          })
          .concat(
            gwoCard.mods(gwoUnit.angelBeam, "pull", {
              target_layers: ["WL_Orbital"],
            }),
            gwoCard.mods(gwoUnit.angelBeam, "push", {
              target_layers: ["WL_LandHorizontal", "WL_WaterSurface"],
            }),
            gwoCard.mods(gwoUnit.angelBeam, "replace", {
              auto_task_type: null,
              manual_fire: false,
            }),
            gwoCard.mods(gwoUnit.angelAmmo, "replace", {
              collision_check: "enemies",
              collision_response: "impact",
            })
          )
      );
    },
  });
});
