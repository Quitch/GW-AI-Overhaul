define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Avenger Upgrade Tech replaces the orbital fighter's laser with an orbital battleship laser."
    ),
    summarize: _.constant("!LOC:Avenger Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_orbital_fighter.png"
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
          "/pa/units/orbital/orbital_launcher/orbital_launcher.json"
        ) &&
        gwaioFunctions.hasUnit(
          "/pa/units/orbital/orbital_fighter/orbital_fighter.json"
        )
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/orbital/orbital_fighter/orbital_fighter.json",
          path: "tools",
          op: "replace",
          value: [
            {
              spec_id:
                "/pa/units/orbital/orbital_battleship/orbital_battleship_tool_weapon.json",
              aim_bone: "bone_body",
              record_index: 0,
              fire_event: "fired0",
              projectiles_per_fire: 1,
              muzzle_bone: "bone_recoil01",
            },
          ],
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
