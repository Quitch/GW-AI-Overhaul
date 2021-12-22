define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js"], function (
  gwaioUnits
) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Improved Energy Weapons tech reduces energy costs for energy based weapons by 75%"
    ),
    summarize: _.constant("!LOC:Improved Energy Weapons"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_energy.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_weapon_upgrade",
      };
    },
    getContext: function (galaxy) {
      return {
        totalSize: galaxy.stars().length,
      };
    },
    deal: function () {
      var chance = 0;

      return { chance: chance };
    },
    buff: function (inventory) {
      var weapons = [
        gwaioUnits.commanderSecondary,
        gwaioUnits.wyrmWeapon,
        gwaioUnits.bumblebeeWeapon,
        gwaioUnits.icarusWeapon,
        gwaioUnits.zeusWeapon,
        gwaioUnits.holkinsWeapon,
        gwaioUnits.pelterWeapon,
        gwaioUnits.sparkWeapon,
        gwaioUnits.sxxWeapon,
        gwaioUnits.artemisWeapon,
        gwaioUnits.heliosWeaponAG,
      ];
      var mods = [];
      weapons.forEach(function (weapon) {
        mods.push(
          {
            file: weapon,
            path: "ammo_capacity",
            op: "multiply",
            value: 0.25,
          },
          {
            file: weapon,
            path: "ammo_demand",
            op: "multiply",
            value: 0.25,
          },
          {
            file: weapon,
            path: "ammo_per_shot",
            op: "multiply",
            value: 0.25,
          }
        );
      });
      inventory.addMods(mods);
    },
    dull: function () {
      //empty
    },
  };
});
