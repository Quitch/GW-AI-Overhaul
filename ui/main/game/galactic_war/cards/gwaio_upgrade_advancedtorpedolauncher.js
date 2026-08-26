define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Advanced Torpedo Launcher Upgrade Tech",
    description:
      "!LOC:Advanced Torpedo Launcher Upgrade Tech enables the targeting of all surface units by the Advanced Torpedo Launcher.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_defense_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: gwoUnit.torpedoLauncherAdvanced,
    chance: 30,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.torpedoLauncherAdvancedWeapon, "replace", {
            spawn_layers: "WL_Air",
          })
          .concat(
            gwoCard.mods(gwoUnit.torpedoLauncherAdvancedWeapon, "push", {
              target_layers: ["WL_LandHorizontal"],
            }),
            gwoCard.mods(gwoUnit.torpedoLauncherAdvancedWeapon, "replace", {
              exclude_unit_types: "",
            }),
            gwoCard.mods(gwoUnit.torpedoLauncherAdvancedLandAmmo, "replace", {
              flight_layer: "Air",
              spawn_layers: "WL_Air",
              cruise_height: 75,
            }),
            gwoCard.mods(gwoUnit.torpedoLauncherAdvancedWaterAmmo, "replace", {
              flight_layer: "Air",
              spawn_layers: "WL_Air",
              cruise_height: 75,
              initial_velocity: 100,
            })
          )
      );
    },
  });
});
