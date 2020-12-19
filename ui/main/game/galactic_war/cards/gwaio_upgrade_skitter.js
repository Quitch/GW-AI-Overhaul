define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant("!LOC:Adds a low powered laser to the Skitter."),
    summarize: _.constant("!LOC:Scouting Technical"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_vehicle.png"
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
          "/pa/units/land/vehicle_factory/vehicle_factory.json"
        ) &&
        gwaioFunctions.hasUnit("/pa/units/land/land_scout/land_scout.json")
      )
        chance = 80;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/land/land_scout/land_scout.json",
          path: "tools",
          op: "replace",
          value: [
            {
              spec_id: "/pa/units/land/land_scout/land_scout_tool_weapon.json",
              aim_bone: "bone_root",
              muzzle_bone: "bone_root",
            },
          ],
        },
        {
          file: "/pa/units/land/land_scout/land_scout.json",
          path: "command_caps",
          op: "push",
          value: "ORDER_Attack",
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
