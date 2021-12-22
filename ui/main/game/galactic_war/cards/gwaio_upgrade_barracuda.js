define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioFunctions, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Barracuda Upgrade Tech increases the rate of fire of the submarine by 200%, but it fires in bursts and requires energy to recharge."
    ),
    summarize: _.constant("!LOC:Barracuda Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_naval_upgrade.png"
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
      if (
        gwaioFunctions.hasUnit(gwaioUnits.navalFactory) &&
        gwaioFunctions.hasUnit(gwaioUnits.barracuda)
      ) {
        chance = 30;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.barracudaWeapon,
          path: "rate_of_fire",
          op: "multiply",
          value: 3,
        },
        {
          file: gwaioUnits.barracudaWeapon,
          path: "ammo_source",
          op: "replace",
          value: "energy",
        },
        {
          file: gwaioUnits.barracudaWeapon,
          path: "ammo_capacity",
          op: "replace",
          value: 300,
        },
        {
          file: gwaioUnits.barracudaWeapon,
          path: "ammo_demand",
          op: "replace",
          value: 150,
        },
        {
          file: gwaioUnits.barracudaWeapon,
          path: "ammo_per_shot",
          op: "replace",
          value: 100,
        },
        {
          file: gwaioUnits.barracudaWeapon,
          path: "carpet_fire",
          op: "replace",
          value: true,
        },
        {
          file: gwaioUnits.barracudaWeapon,
          path: "carpet_wait_for_full_ammo",
          op: "replace",
          value: true,
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
