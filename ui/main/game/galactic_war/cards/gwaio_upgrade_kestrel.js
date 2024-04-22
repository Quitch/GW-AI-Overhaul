define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Kestrel Upgrade Tech replaces the gunship's bullet weapons with flamethrowers."
    ),
    summarize: _.constant("!LOC:Kestrel Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_combat_air_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), gwoUnit.kestrel)) {
        chance = 60;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwoUnit.kestrel,
          path: "events.fired.effect_spec",
          op: "replace",
          value:
            "/pa/units/land/tank_armor/tank_armor_muzzle_flame.pfx socket_rightMuzzle /pa/units/land/tank_armor/tank_armor_muzzle_flame.pfx socket_leftMuzzle",
        },
        {
          file: gwoUnit.kestrelWeapon,
          path: "max_range",
          op: "replace",
          value: 20,
        },
        {
          file: gwoUnit.kestrelWeapon,
          path: "spread_fire",
          op: "replace",
          value: true,
        },
        {
          file: gwoUnit.kestrelAmmo,
          path: "ammo_type",
          op: "replace",
          value: "AMMO_Beam",
        },
        {
          file: gwoUnit.kestrelAmmo,
          path: "damage",
          op: "replace",
          value: 100,
        },
      ]);
    },
    dull: function () {},
  };
});
