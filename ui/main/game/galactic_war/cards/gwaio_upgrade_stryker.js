define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioCards, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Stryker Upgrade Tech increases the rate of fire of the attack vehicle by 300%, but it fires in bursts and requires energy to recharge."
    ),
    summarize: _.constant("!LOC:Stryker Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_vehicle_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwaioCards.getContext,
    deal: function () {
      var chance = 0;
      if (gwaioCards.hasUnit(gwaioUnits.stryker)) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.strykerWeapon,
          path: "rate_of_fire",
          op: "multiply",
          value: 4,
        },
        {
          file: gwaioUnits.strykerWeapon,
          path: "ammo_source",
          op: "replace",
          value: "energy",
        },
        {
          file: gwaioUnits.strykerWeapon,
          path: "ammo_capacity",
          op: "replace",
          value: 100,
        },
        {
          file: gwaioUnits.strykerWeapon,
          path: "ammo_demand",
          op: "replace",
          value: 50,
        },
        {
          file: gwaioUnits.strykerWeapon,
          path: "ammo_per_shot",
          op: "replace",
          value: 25,
        },
        {
          file: gwaioUnits.strykerWeapon,
          path: "carpet_fire",
          op: "replace",
          value: true,
        },
        {
          file: gwaioUnits.strykerWeapon,
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
