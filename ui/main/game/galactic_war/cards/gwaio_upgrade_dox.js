define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioCards, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Dox Upgrade Tech replaces the basic infantry's bullet weapons with flamethrowers."
    ),
    summarize: _.constant("!LOC:Dox Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_bot_combat_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwaioCards.getContext,
    deal: function () {
      var chance = 0;
      if (gwaioCards.hasUnit(gwaioUnits.dox)) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.dox,
          path: "events.fired.effect_spec",
          op: "replace",
          value:
            "/pa/units/land/tank_armor/tank_armor_muzzle_flame.pfx socket_rightMuzzle /pa/units/land/tank_armor/tank_armor_muzzle_flame.pfx socket_leftMuzzle",
        },
        {
          file: gwaioUnits.doxWeapon,
          path: "max_range",
          op: "replace",
          value: 20,
        },
        {
          file: gwaioUnits.doxWeapon,
          path: "spread_fire",
          op: "replace",
          value: true,
        },
        {
          file: gwaioUnits.doxAmmo,
          path: "ammo_type",
          op: "replace",
          value: "AMMO_Beam",
        },
        {
          file: gwaioUnits.doxAmmo,
          path: "damage",
          op: "replace",
          value: 100,
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
