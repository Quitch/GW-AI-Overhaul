define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioFunctions, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Narwhal Upgrade Tech adds a torpedo launcher to the frigate."
    ),
    summarize: _.constant("!LOC:Narwhal Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_naval_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwaioFunctions.getContext,
    deal: function () {
      var chance = 0;
      if (
        gwaioFunctions.hasUnit(gwaioUnits.navalFactory) &&
        gwaioFunctions.hasUnit(gwaioUnits.narwhal)
      ) {
        chance = 30;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.narwhal,
          path: "tools",
          op: "push",
          value: {
            spec_id: gwaioUnits.narwhalTorpedo,
            record_index: 2,
            aim_bone: "bone_root",
            muzzle_bone: "bone_root",
            fire_event: "fired2",
            show_range: false,
          },
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
