define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioFunctions, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Advanced Fabrication Aircraft Upgrade Tech attaches the Angel AA interception beam to the advanced air fabricator."
    ),
    summarize: _.constant("!LOC:Advanced Fabrication Aircraft Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_metal_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_air",
      };
    },
    getContext: gwaioFunctions.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        (gwaioFunctions.hasUnit(gwaioUnits.airFactoryAdvanced) ||
          inventory.hasCard("gwaio_upgrade_airfactory")) &&
        gwaioFunctions.hasUnit(gwaioUnits.airFabberAdvanced)
      ) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.airFabberAdvanced,
          path: "tools",
          op: "push",
          value: {
            spec_id: gwaioUnits.angelBeam,
            aim_bone: "bone_turret",
            record_index: 0,
            muzzle_bone: "socket_muzzle",
          },
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
