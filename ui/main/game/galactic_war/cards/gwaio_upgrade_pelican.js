define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Pelican Upgrade Tech allows air transports to carry commanders."
    ),
    summarize: _.constant("!LOC:Pelican Upgrade Tech"),
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
      if (
        gwaioFunctions.hasUnit("/pa/units/air/air_factory/air_factory.json") &&
        gwaioFunctions.hasUnit("/pa/units/air/transport/transport.json")
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/air/transport/transport.json",
          path: "transporter.transportable_unit_types",
          op: "replace",
          value: "Mobile & Land",
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
