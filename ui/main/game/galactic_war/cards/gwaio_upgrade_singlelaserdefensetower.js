define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Single Laser Defense Tower Upgrade Tech replaces the basic turret's laser with a fabrication arm which repairs units and reclaims wreckage within range."
    ),
    summarize: _.constant("!LOC:Single Laser Defense Tower Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_turret.png"
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
          "/pa/units/land/laser_defense_single/laser_defense_single.json"
        )
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/land/laser_defense_single/laser_defense_single.json",
          path: "tools",
          op: "replace",
          value: [
            {
              spec_id:
                "/pa/units/land/fabrication_bot_combat_adv/fabrication_bot_combat_adv_build_arm.json",
              aim_bone: "bone_pitch",
            },
          ],
        },
        {
          file: "/pa/units/land/laser_defense_single/laser_defense_single.json",
          path: "command_caps",
          op: "replace",
          value: ["ORDER_Reclaim", "ORDER_Repair"],
        },
        {
          file: "/pa/units/land/laser_defense_single/laser_defense_single.json",
          path: "fx_offsets",
          op: "replace",
          value: {
            type: "build",
            filename: "/pa/effects/specs/fab_combat_spray.pfx",
            bone: "socket_muzzle",
            offset: [0, 0, 0],
            orientation: [0, 0, 0],
          },
        },
        {
          file: "/pa/units/land/laser_defense_single/laser_defense_single.json",
          path: "audio",
          op: "replace",
          value: {
            loops: {
              build: {
                cue: "/SE/Construction/Fab_contruction_beam_loop",
                flag: "build_target_changed",
                should_start_func: "has_build_target",
                should_stop_func: "no_build_target",
              },
            },
          },
        },
        {
          file: "/pa/units/land/laser_defense_single/laser_defense_single.json",
          path: "unit_types",
          op: "push",
          value: "UNITTYPE_Construction",
        },
      ];
      // Reinstate the Nomad Commander loadout's structure movement
      if (inventory.hasCard("gwaio_start_nomad"))
        mods.push({
          file: "/pa/units/land/laser_defense_single/laser_defense_single.json",
          path: "command_caps",
          op: "push",
          value: ["ORDER_Move", "ORDER_Patrol", "ORDER_Assist"],
        });
      inventory.addMods(mods);

      inventory.addAIMods([
        {
          type: "fabber",
          op: "replace",
          toBuild: "BasicLandDefenseSingle",
          idToMod: "value0",
          value: 1,
          refId: "unit_type_string0",
          refValue: "Structure & Basic & SurfaceDefense", // TITANS
        },
        {
          type: "fabber",
          op: "replace",
          toBuild: "BasicLandDefenseSingle",
          idToMod: "unit_type_string0",
          value: "Structure & Basic & Construction",
          refId: "unit_type_string0",
          refValue: "Structure & Basic & SurfaceDefense", // TITANS
        },
        {
          type: "fabber",
          op: "replace",
          toBuild: "BasicLandDefenseSingle",
          idToMod: "value0",
          value: 1,
          refId: "unit_type_string0",
          refValue: "Structure & (SurfaceDefense | Tactical) - Shield", // Queller
        },
        {
          type: "fabber",
          op: "replace",
          toBuild: "BasicLandDefenseSingle",
          idToMod: "unit_type_string0",
          value: "Structure & Basic & Construction",
          refId: "unit_type_string0",
          refValue: "Structure & (SurfaceDefense | Tactical) - Shield", // Queller
        },
        {
          type: "fabber",
          op: "replace",
          toBuild: "BasicLandDefenseSingle",
          idToMod: "priority",
          value: 0, // Turn off for Queller Guardians
          refId: "name",
          refValue: "Single Laser Defense Tower - Snipe",
        },
      ]);
    },
    dull: function () {},
  };
});
