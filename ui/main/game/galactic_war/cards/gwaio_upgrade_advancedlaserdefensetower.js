define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Advanced Laser Defense Tower Upgrade Tech",
    description:
      "!LOC:Advanced Laser Defense Tower Upgrade Tech increases the rate of fire of the advanced turret by 300%, but it fires in bursts and requires energy to recharge.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_defense_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: gwoUnit.laserDefenseTowerAdvanced,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.laserDefenseTowerAdvancedWeapon, "multiply", {
            rate_of_fire: 4,
          })
          .concat(
            gwoCard.mods(gwoUnit.laserDefenseTowerAdvancedWeapon, "replace", {
              ammo_source: "energy",
              ammo_capacity: 1200,
              ammo_demand: 300,
              ammo_per_shot: 100,
              spread_fire: true,
              carpet_fire: true,
              carpet_wait_for_full_ammo: true,
            })
          )
      );
    },
  });
});
