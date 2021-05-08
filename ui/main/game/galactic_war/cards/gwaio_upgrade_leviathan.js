define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Leviathan Upgrade Tech adds a radar to the battleship."
    ),
    summarize: _.constant("!LOC:Leviathan Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_naval.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_combat",
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
          "/pa/units/sea/naval_factory_adv/naval_factory_adv.json"
        ) ||
          inventory.hasCard("gwaio_upgrade_navalfactory")) &&
        gwaioFunctions.hasUnit("/pa/units/sea/battleship/battleship.json")
      )
        chance = 30;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/sea/battleship/battleship.json",
          path: "recon.observer.items",
          op: "push",
          value: {
            shape: "capsule",
            layer: "surface_and_air",
            channel: "radar",
            radius: 350,
          },
        },
        {
          file: "/pa/units/sea/battleship/battleship.json",
          path: "recon.observer.items",
          op: "push",
          value: {
            shape: "capsule",
            layer: "underwater",
            channel: "radar",
            radius: 350,
          },
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
