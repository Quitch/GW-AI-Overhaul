define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Dox Upgrade Tech",
    description:
      "!LOC:Dox Upgrade Tech replaces the basic infantry's bullet weapons with flamethrowers.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_bot_combat_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: gwoUnit.dox,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.dox, "replace", {
            "events.fired.effect_spec":
              "/pa/units/land/tank_armor/tank_armor_muzzle_flame.pfx socket_rightMuzzle /pa/units/land/tank_armor/tank_armor_muzzle_flame.pfx socket_leftMuzzle",
          })
          .concat(
            gwoCard.mods(gwoUnit.doxWeapon, "multiply", { max_range: 0.27 }),
            gwoCard.mods(gwoUnit.doxWeapon, "replace", { spread_fire: true }),
            gwoCard.mods(gwoUnit.doxAmmo, "replace", {
              ammo_type: "AMMO_Beam",
            }),
            gwoCard.mods(gwoUnit.doxAmmo, "multiply", { damage: 10 })
          )
      );
    },
  });
});
