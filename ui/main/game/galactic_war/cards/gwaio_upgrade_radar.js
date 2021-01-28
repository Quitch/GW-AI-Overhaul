define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Radar Upgrade Tech doubles the vision radius of basic radar."
    ),
    summarize: _.constant("!LOC:Radar Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_energy.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_efficiency",
      };
    },
    getContext: function (galaxy) {
      return {
        totalSize: galaxy.stars().length,
      };
    },
    deal: function (unused0, unused1, inventory) {
      var chance = 0;
      if (
        gwaioFunctions.hasUnit("/pa/units/land/radar/radar.json") &&
        (gwaioFunctions.hasUnit(
          "/pa/units/land/bot_factory/bot_factory.json"
        ) ||
          gwaioFunctions.hasUnit(
            "/pa/units/air/air_factory/air_factory.json"
          ) ||
          gwaioFunctions.hasUnit(
            "/pa/units/sea/naval_factory/naval_factory.json"
          ) ||
          gwaioFunctions.hasUnit(
            "/pa/units/land/vehicle_factory/vehicle_factory.json"
          ) ||
          inventory.hasCard("gwc_start_artillery") ||
          inventory.hasCard("nem_start_tower_rush"))
      )
        chance = 70;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/land/radar/radar.json",
          path: "recon.observer.items.0.radius",
          op: "multiply",
          value: 2,
        },
        {
          file: "/pa/units/land/radar/radar.json",
          path: "recon.observer.items.3.radius",
          op: "multiply",
          value: 2,
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
