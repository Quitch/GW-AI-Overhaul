define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Solar Array Upgrade Tech enables interception of tactical missiles and drop pods by the Solar Array."
    ),
    summarize: _.constant("!LOC:Solar Array Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_orbital_fighter.png"
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
      if (
        gwaioFunctions.hasUnit("/pa/units/orbital/solar_array/solar_array.json")
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/orbital/solar_array/solar_array.json",
          path: "tools",
          op: "replace",
          value: [
            {
              spec_id:
                "/pa/units/land/bot_sniper/bot_sniper_beam_tool_weapon.json",
              aim_bone: "bone_root",
              record_index: 0,
              fire_event: "fired",
              muzzle_bone: "bone_root",
            },
            {
              spec_id:
                "/pa/units/orbital/ion_defense/ion_defense_tool_antidrop.json",
              aim_bone: "bone_root",
              record_index: 1,
              fire_event: "fired",
              muzzle_bone: "bone_root",
            },
          ],
        },
      ]);
    },
    dull: function () {},
  };
});
