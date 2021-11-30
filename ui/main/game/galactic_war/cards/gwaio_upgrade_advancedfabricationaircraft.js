define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
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
    getContext: function (galaxy) {
      return {
        totalSize: galaxy.stars().length,
      };
    },
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        (gwaioFunctions.hasUnit(
          "/pa/units/air/air_factory_adv/air_factory_adv.json"
        ) ||
          inventory.hasCard("gwaio_upgrade_airfactory")) &&
        gwaioFunctions.hasUnit(
          "/pa/units/air/fabrication_aircraft_adv/fabrication_aircraft_adv.json"
        )
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/air/fabrication_aircraft_adv/fabrication_aircraft_adv.json",
          path: "tools",
          op: "push",
          value: {
            spec_id:
              "/pa/units/air/support_platform/support_platform_tool_interception.json",
            aim_bone: "bone_turret",
            record_index: 0,
            muzzle_bone: "socket_muzzle",
          },
        },
      ]);
    },
    dull: function () {},
  };
});
