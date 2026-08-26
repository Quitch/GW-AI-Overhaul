define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Kestrel Upgrade Tech",
    description:
      "!LOC:Kestrel Upgrade Tech replaces the gunship's bullet weapons with flamethrowers.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_combat_air_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: gwoUnit.kestrel,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.kestrel, "replace", {
            "events.fired.effect_spec":
              "/pa/units/land/tank_armor/tank_armor_muzzle_flame.pfx socket_rightMuzzle /pa/units/land/tank_armor/tank_armor_muzzle_flame.pfx socket_leftMuzzle",
          })
          .concat(
            gwoCard.mods(gwoUnit.kestrelWeapon, "multiply", {
              max_range: 0.33,
            }),
            gwoCard.mods(gwoUnit.kestrelWeapon, "replace", {
              spread_fire: true,
            }),
            gwoCard.mods(gwoUnit.kestrelAmmo, "replace", {
              ammo_type: "AMMO_Beam",
            }),
            gwoCard.mods(gwoUnit.kestrelAmmo, "multiply", { damage: 5 })
          )
      );
    },
  });
});
