define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Narwhal Upgrade Tech adds a torpedo launcher to the frigate."
    ),
    summarize: _.constant("!LOC:Narwhal Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_naval.png"
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
          "/pa/units/sea/naval_factory/naval_factory.json"
        ) &&
        gwaioFunctions.hasUnit("/pa/units/sea/frigate/frigate.json")
      )
        chance = 35;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/sea/frigate/frigate.json",
          path: "tools",
          op: "push",
          value: {
            spec_id: "/pa/units/sea/frigate/frigate_tool_weapon_torpedo.json",
            record_index: 2,
            aim_bone: "bone_root",
            muzzle_bone: "bone_root",
            fire_event: "fired2",
            show_range: false,
          },
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
