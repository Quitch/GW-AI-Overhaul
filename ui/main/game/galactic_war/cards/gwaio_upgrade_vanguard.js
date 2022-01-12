define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioCards, gwaioUnits) {
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
    getContext: gwaioCards.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwaioCards.hasUnit(inventory.units(), gwaioUnits.vanguard)) {
        chance = 60;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.vanguard,
          path: "tools",
          op: "push",
          value: {
            spec_id: gwaioUnits.mendBuildArm,
            aim_bone: "bone_turret",
            muzzle_bone: "socket_muzzle",
          },
        },
        {
          file: gwaioUnits.vanguard,
          path: "command_caps",
          op: "push",
          value: ["ORDER_Repair"],
        },
        {
          file: gwaioUnits.vanguard,
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
          file: gwaioUnits.vanguard,
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
