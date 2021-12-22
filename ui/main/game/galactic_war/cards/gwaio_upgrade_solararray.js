define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioFunctions, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Solar Array Upgrade Tech enables interception of tactical missiles and drop pods by the Solar Array."
    ),
    summarize: _.constant("!LOC:Solar Array Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_orbital_fighter_upgrade.png"
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
    deal: function () {
      var chance = 0;
      if (gwaioFunctions.hasUnit(gwaioUnits.solarArray)) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.solarArray,
          path: "tools",
          op: "push",
          value: [
            {
              spec_id: gwaioUnits.gileEBeam,
              aim_bone: "bone_root",
              record_index: 0,
              fire_event: "fired",
              muzzle_bone: "bone_root",
            },
            {
              spec_id: gwaioUnits.umbrellaBeam,
              aim_bone: "bone_root",
              record_index: 1,
              fire_event: "fired",
              muzzle_bone: "bone_root",
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
