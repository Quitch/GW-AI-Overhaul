define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Inferno Upgrade Tech",
    description:
      "!LOC:Inferno Upgrade Tech adds the Stitch repair arm to the flame tank. They will not repair when given attack orders.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_vehicle_armor_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_armor",
    requires: gwoUnit.inferno,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.inferno, "push", {
            tools: {
              spec_id: gwoUnit.stitchBuildArm,
              aim_bone: "bone_turret",
              muzzle_bone: "socket_muzzle",
            },
          })
          .concat(
            [{ file: gwoUnit.inferno, path: "tools.1.spec_id", op: "tag" }],
            gwoCard.mods(gwoUnit.inferno, "push", {
              command_caps: ["ORDER_Repair"],
            }),
            gwoCard.mods(gwoUnit.inferno, "replace", {
              "audio.loops.build": {
                cue: "/SE/Construction/Fab_contruction_beam_loop",
                flag: "build_target_changed",
                should_start_func: "has_build_target",
                should_stop_func: "no_build_target",
              },
              fx_offsets: [
                {
                  type: "build",
                  filename: "/pa/effects/specs/fab_combat_spray.pfx",
                  bone: "socket_muzzle",
                  offset: [0, 0, 0],
                  orientation: [0, 0, 0],
                },
              ],
            })
          )
      );
    },
  });
});
