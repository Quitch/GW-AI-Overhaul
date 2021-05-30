define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Firefly Upgrade Tech adds a low powered laser to the air scout and increases its vision by 100%."
    ),
    summarize: _.constant("!LOC:Firefly Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_combat_air.png"
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
      if (gwaioFunctions.hasUnit("/pa/units/air/air_scout/air_scout.json"))
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/air/air_scout/air_scout.json",
          path: "tools",
          op: "replace",
          value: [
            {
              spec_id: "/pa/units/land/air_scout/air_scout_tool_weapon.json",
              aim_bone: "bone_root",
              muzzle_bone: "bone_root",
            },
          ],
        },
        {
          file: "/pa/units/air/air_scout/air_scout.json",
          path: "command_caps",
          op: "push",
          value: "ORDER_Attack",
        },
        {
          file: "/pa/units/air/air_scout/air_scout.json",
          path: "recon.observer.items.0.radius",
          op: "multiply",
          value: 2,
        },
        {
          file: "/pa/units/air/air_scout/air_scout.json",
          path: "recon.observer.items.1.radius",
          op: "multiply",
          value: 2,
        },
      ]);
    },
    dull: function () {},
  };
});
