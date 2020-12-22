define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Vanguard Upgrade Tech enables the heavy tank to intercept tactical missiles."
    ),
    summarize: _.constant("!LOC:Vanguard Upgrade Tech"),
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
          "/pa/units/land/vehicle_factory_adv/vehicle_factory_adv.json"
        ) &&
        gwaioFunctions.hasUnit(
          "/pa/units/land/tank_heavy_armor/tank_heavy_armor.json"
        )
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/land/tank_heavy_armor/tank_heavy_armor.json",
          path: "tools.aim_bone",
          op: "replace",
          value: "bone_turret",
        },
        {
          file: "/pa/units/land/tank_heavy_armor/tank_heavy_armor.json",
          path: "tools.muzzle_bone",
          op: "replace",
          value: "socket_muzzle",
        },
        {
          file: "/pa/units/land/tank_heavy_armor/tank_heavy_armor.json",
          path: "tools.record_index",
          op: "replace",
          value: 1,
        },
        {
          file: "/pa/units/land/tank_heavy_armor/tank_heavy_armor.json",
          path: "tools.spec_id",
          op: "replace",
          value: "/pa/units/land/bot_sniper/bot_sniper_beam_tool_weapon.json",
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
