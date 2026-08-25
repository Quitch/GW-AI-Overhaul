define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Manhattan Upgrade Tech",
    description:
      "!LOC:Manhattan Upgrade Tech doubles the radius of the mobile nuke's explosion.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_vehicle_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: gwoUnit.manhattan,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.mods(gwoUnit.manhattanDeath, "multiply", {
          splash_radius: 2,
          full_damage_splash_radius: 2,
          burn_radius: 2,
          "damage_volume.initial_radius": 2,
          "damage_volume.radius_velocity": 2,
          "damage_volume.burnable_remove_radius": 2,
        })
      );
    },
  });
});
