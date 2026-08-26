define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Grenadier Upgrade Tech",
    description:
      "!LOC:Grenadier Upgrade Tech replaces this fire support's artillery with mine launchers, triples its cost and reduces its rate of fire by 75%.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_bot_combat_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: gwoUnit.grenadier,
    buff: function (inventory) {
      inventory.addUnits(gwoUnit.landMine);

      inventory.addMods(
        gwoCard
          .mods(gwoUnit.grenadier, "multiply", { build_metal_cost: 3 })
          .concat(
            gwoCard.mods(gwoUnit.grenadierWeapon, "multiply", {
              rate_of_fire: 0.25,
            }),
            gwoCard.mods(gwoUnit.grenadierAmmo, "replace", {
              damage: 0,
              splash_damage: 0,
              splash_radius: 0,
              full_damage_splash_radius: 0,
              spawn_unit_on_death: gwoUnit.landMine,
            }),
            [
              {
                file: gwoUnit.grenadierAmmo,
                path: "spawn_unit_on_death",
                op: "tag",
              },
            ]
          )
      );
    },
  });
});
