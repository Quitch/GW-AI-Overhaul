define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Solar Array Upgrade Tech enables interception of tactical missiles by the Solar Array."
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
      var mods = [
        {
          file: "/pa/units/orbital/solar_array/solar_array.json",
          path: "tools",
          op: "push",
          value: {
            spec_id:
              "/pa/units/land/bot_sniper/bot_sniper_beam_tool_weapon.json",
            aim_bone: "bone_root",
            record_index: 0,
            muzzle_bone: "bone_root",
          },
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
