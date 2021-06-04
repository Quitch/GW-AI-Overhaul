define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Stryker Upgrade Tech increases the rate of fire of the attack vehicle by 300%, but it fires in bursts and requires energy to recharge."
    ),
    summarize: _.constant("!LOC:Stryker Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_vehicle.png"
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
        gwaioFunctions.hasUnit(
          "/pa/units/land/attack_vehicle/attack_vehicle.json"
        )
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/land/attack_vehicle/attack_vehicle_tool_weapon.json",
          path: "rate_of_fire",
          op: "multiply",
          value: 4,
        },
        {
          file: "/pa/units/land/attack_vehicle/attack_vehicle_tool_weapon.json",
          path: "ammo_source",
          op: "replace",
          value: "energy",
        },
        {
          file: "/pa/units/land/attack_vehicle/attack_vehicle_tool_weapon.json",
          path: "ammo_capacity",
          op: "replace",
          value: 100,
        },
        {
          file: "/pa/units/land/attack_vehicle/attack_vehicle_tool_weapon.json",
          path: "ammo_demand",
          op: "replace",
          value: 50,
        },
        {
          file: "/pa/units/land/attack_vehicle/attack_vehicle_tool_weapon.json",
          path: "ammo_per_shot",
          op: "replace",
          value: 25,
        },
        {
          file: "/pa/units/land/attack_vehicle/attack_vehicle_tool_weapon.json",
          path: "carpet_fire",
          op: "replace",
          value: true,
        },
        {
          file: "/pa/units/land/attack_vehicle/attack_vehicle_tool_weapon.json",
          path: "carpet_wait_for_full_ammo",
          op: "replace",
          value: true,
        },
      ]);
    },
    dull: function () {},
  };
});
