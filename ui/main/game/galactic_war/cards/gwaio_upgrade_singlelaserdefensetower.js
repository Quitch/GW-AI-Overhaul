define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Single Laser Defense Tower Upgrade Tech replaces the basic turret's laser with a fabrication arm which repairs units and reclaims wreckage within range."
      ) +
        "<br> <br>" +
        loc("!LOC:Adds a new slot for another technology.")
    ),
    summarize: _.constant("!LOC:Single Laser Defense Tower Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_turret_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), gwoUnit.singleLaserDefenseTower)) {
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
      const mods = [
        {
          file: gwoUnit.singleLaserDefenseTower,
          path: "tools",
          op: "replace",
          value: [
            {
              spec_id: gwoUnit.mendBuildArm,
              aim_bone: "bone_pitch",
            },
          ],
        },
        {
          file: gwoUnit.singleLaserDefenseTower,
          path: "command_caps",
          op: "replace",
          value: ["ORDER_Reclaim", "ORDER_Repair"],
        },
        {
          file: gwoUnit.singleLaserDefenseTower,
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
          file: gwoUnit.singleLaserDefenseTower,
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
          file: gwoUnit.singleLaserDefenseTower,
          path: "unit_types",
          op: "push",
          value: "UNITTYPE_Construction",
        },
      ];
      // Reinstate the Nomad Commander loadout's structure movement
      if (inventory.hasCard("gwaio_start_nomad")) {
        mods.push({
          file: gwoUnit.singleLaserDefenseTower,
          path: "command_caps",
          op: "push",
          value: ["ORDER_Move", "ORDER_Patrol", "ORDER_Assist"],
        });
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
          value: 0, // Turn off for Queller
          refId: "name",
          refValue: "Single Laser Defense Tower - Snipe",
        },
      ]);
    },
    dull: function () {},
  };
});
