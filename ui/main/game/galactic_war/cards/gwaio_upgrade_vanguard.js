define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Vanguard Upgrade Tech adds the Mend repair arm to the flame tank. They will not repair when given attack orders."
    ),
    summarize: _.constant("!LOC:Vanguard Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_vehicle_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_speed",
      };
    },
    getContext: function (galaxy) {
      return {
        totalSize: galaxy.stars().length,
      };
    },
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        (gwaioFunctions.hasUnit(
          "/pa/units/land/vehicle_factory_adv/vehicle_factory_adv.json"
        ) ||
          inventory.hasCard("gwaio_upgrade_vehiclefactory")) &&
        gwaioFunctions.hasUnit(
          "/pa/units/land/tank_heavy_armor/tank_heavy_armor.json"
        )
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/land/tank_heavy_armor/tank_heavy_armor.json",
          path: "tools",
          op: "push",
          value: {
            spec_id:
              "/pa/units/land/fabrication_bot_combat_adv/fabrication_bot_combat_adv_build_arm.json",
            aim_bone: "bone_turret",
            muzzle_bone: "socket_muzzle",
          },
        },
        {
          file: "/pa/units/land/tank_heavy_armor/tank_heavy_armor.json",
          path: "command_caps",
          op: "push",
          value: ["ORDER_Repair"],
        },
        {
          file: "/pa/units/land/tank_heavy_armor/tank_heavy_armor.json",
          path: "audio.loops.build",
          op: "replace",
          value: {
            cue: "/SE/Construction/Fab_contruction_beam_loop",
            flag: "build_target_changed",
            should_start_func: "has_build_target",
            should_stop_func: "no_build_target",
          },
        },
        {
          file: "/pa/units/land/tank_heavy_armor/tank_heavy_armor.json",
          path: "fx_offsets",
          op: "replace",
          value: [
            {
              type: "build",
              filename: "/pa/effects/specs/fab_combat_spray.pfx",
              bone: "socket_muzzle",
              offset: [0, 0, 0],
              orientation: [0, 0, 0],
            },
          ],
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
