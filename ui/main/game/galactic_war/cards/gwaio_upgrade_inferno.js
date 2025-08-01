define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Inferno Upgrade Tech adds the Stitch repair arm to the flame tank. They will not repair when given attack orders."
      ) +
        "<br> <br>" +
        loc("!LOC:Adds a new slot for another technology.")
    ),
    summarize: _.constant("!LOC:Inferno Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_vehicle_armor_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_armor",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), gwoUnit.inferno)) {
        chance = 60;
      }
      return {
        params: {
          allowOverflow: true,
        },
        chance: chance,
      };
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods([
        {
          file: gwoUnit.inferno,
          path: "tools",
          op: "push",
          value: {
            spec_id: gwoUnit.stitchBuildArm,
            aim_bone: "bone_turret",
            muzzle_bone: "socket_muzzle",
          },
        },
        {
          file: gwoUnit.inferno,
          path: "command_caps",
          op: "push",
          value: ["ORDER_Repair"],
        },
        {
          file: gwoUnit.inferno,
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
          file: gwoUnit.inferno,
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
    dull: function () {},
  };
});
