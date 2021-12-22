define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioFunctions, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Stinger Upgrade Tech replaces the anti-air bot's missiles with flak from the Flak Cannon. It fires two projectiles per volley as opposed to the Flak Cannons' four."
    ),
    summarize: _.constant("!LOC:Stinger Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_bot_combat_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: function (galaxy) {
      return {
        totalSize: galaxy.stars().length,
      };
    },
    deal: function () {
      var chance = 0;
      if (gwaioFunctions.hasUnit(gwaioUnits.stinger)) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/land/bot_aa/bot_aa_weapon.json",
          path: "tools",
          op: "replace",
          value: {
            spec_id: gwaioUnits.flakWeapon,
            aim_bone: "bone_turret",
            projectiles_per_fire: 2,
            muzzle_bone: ["socket_rightMuzzle", "socket_leftMuzzle"],
          },
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
