define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  var TITANS_BASIC_DEFENCE = "Structure & Basic & SurfaceDefense";
  var QUELLER_BASIC_DEFENCE =
    "Structure & (SurfaceDefense | Tactical) - Shield";

  return gwoCard.upgradeCard({
    name: "!LOC:Single Laser Defense Tower Upgrade Tech",
    description:
      "!LOC:Single Laser Defense Tower Upgrade Tech replaces the basic turret's laser with a fabrication arm which repairs units and reclaims wreckage within range.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_turret_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: gwoUnit.singleLaserDefenseTower,
    buff: function (inventory) {
      var mods = gwoCard
        .mods(gwoUnit.singleLaserDefenseTower, "replace", {
          tools: [{ spec_id: gwoUnit.mendBuildArm, aim_bone: "bone_pitch" }],
        })
        .concat(
          [
            {
              file: gwoUnit.singleLaserDefenseTower,
              path: "tools.0.spec_id",
              op: "tag",
            },
          ],
          gwoCard.mods(gwoUnit.singleLaserDefenseTower, "replace", {
            command_caps: ["ORDER_Reclaim", "ORDER_Repair"],
            fx_offsets: [
              {
                type: "build",
                filename: "/pa/effects/specs/fab_combat_spray.pfx",
                bone: "socket_muzzle",
                offset: [0, 0, 0],
                orientation: [0, 0, 0],
              },
            ],
          }),
          gwoCard.mods(gwoUnit.singleLaserDefenseTower, "merge", {
            audio: {
              loops: {
                build: {
                  cue: "/SE/Construction/Fab_contruction_beam_loop",
                  flag: "build_target_changed",
                  should_start_func: "has_build_target",
                  should_stop_func: "no_build_target",
                },
              },
            },
          }),
          gwoCard.mods(gwoUnit.singleLaserDefenseTower, "push", {
            unit_types: "UNITTYPE_Construction",
          })
        );
      if (inventory.hasCard("gwaio_start_nomad")) {
        mods = mods.concat(
          gwoCard.mods(gwoUnit.singleLaserDefenseTower, "push", {
            command_caps: ["ORDER_Move", "ORDER_Patrol", "ORDER_Assist"],
          })
        );
      }
      inventory.addMods(mods);

      inventory.addAIMods([
        {
          type: "fabber",
          op: "replace",
          toBuild: "BasicLandDefenseSingle",
          idToMod: "value0",
          value: 1,
          refId: "unit_type_string0",
          refValue: TITANS_BASIC_DEFENCE,
        },
        {
          type: "fabber",
          op: "replace",
          toBuild: "BasicLandDefenseSingle",
          idToMod: "unit_type_string0",
          value: "Structure & Basic & Construction",
          refId: "unit_type_string0",
          refValue: TITANS_BASIC_DEFENCE,
        },
        {
          type: "fabber",
          op: "replace",
          toBuild: "BasicLandDefenseSingle",
          idToMod: "value0",
          value: 1,
          refId: "unit_type_string0",
          refValue: QUELLER_BASIC_DEFENCE,
        },
        {
          type: "fabber",
          op: "replace",
          toBuild: "BasicLandDefenseSingle",
          idToMod: "unit_type_string0",
          value: "Structure & Basic & Construction",
          refId: "unit_type_string0",
          refValue: QUELLER_BASIC_DEFENCE,
        },
        {
          type: "fabber",
          op: "replace",
          toBuild: "BasicLandDefenseSingle",
          idToMod: "priority",
          value: 0,
          refId: "name",
          refValue: "Single Laser Defense Tower - Snipe",
        },
      ]);
    },
  });
});
