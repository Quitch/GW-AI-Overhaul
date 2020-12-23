define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Omega Upgrade Tech replaces the orbital battleship's anti-ground laser with an anti-ground drone launcher."
    ),
    summarize: _.constant("!LOC:Omega Upgrade Tech"),
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
          "/pa/units/orbital/orbital_factory/orbital_factory.json"
        ) &&
        gwaioFunctions.hasUnit(
          "/pa/units/orbital/orbital_battleship/orbital_battleship.json"
        )
      )
        chance = 70;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/orbital/orbital_battleship/orbital_battleship.json",
          path: "tools.4.spec_id",
          op: "replace",
          value: "/pa/units/sea/drone_carrier/carrier/carrier_tool_weapon.json",
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
