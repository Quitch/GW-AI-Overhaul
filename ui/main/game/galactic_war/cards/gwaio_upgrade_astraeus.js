define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Astraeus Upgrade Tech doubles the orbital lander's interplanetary movement speed."
    ),
    summarize: _.constant("!LOC:Astraeus Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_orbital.png"
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
        gwaioFunctions.hasUnit(
          "/pa/units/orbital/orbital_launcher/orbital_launcher.json"
        ) &&
        gwaioFunctions.hasUnit(
          "/pa/units/orbital/orbital_lander/orbital_lander.json"
        )
      )
        chance = 70;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/orbital/orbital_lander/orbital_lander.json",
          path: "system_velocity_multiplier",
          op: "multiply",
          value: 2,
        },
        {
          file: "/pa/units/orbital/orbital_lander/orbital_lander.json",
          path: "gravwell_velocity_multiplier",
          op: "multiply",
          value: 2,
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
