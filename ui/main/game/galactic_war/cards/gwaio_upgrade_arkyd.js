define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:ARKYD Upgrade Tech increases the vision and radar of the basic orbital radar by 50%."
    ),
    summarize: _.constant("!LOC:ARKYD Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_intelligence_fabrication.png"
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
    deal: function () {
      var chance = 0;
      if (
        gwaioFunctions.hasUnit(
          "/pa/units/orbital/radar_satellite/radar_satellite.json"
        )
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/orbital/radar_satellite/radar_satellite.json",
          path: "recon.observer.items.0.radius",
          op: "multiply",
          value: 1.5,
        },
        {
          file: "/pa/units/orbital/radar_satellite/radar_satellite.json",
          path: "recon.observer.items.1.radius",
          op: "multiply",
          value: 1.5,
        },
        {
          file: "/pa/units/orbital/radar_satellite/radar_satellite.json",
          path: "recon.observer.items.2.radius",
          op: "multiply",
          value: 1.5,
        },
        {
          file: "/pa/units/orbital/radar_satellite/radar_satellite.json",
          path: "recon.observer.items.3.radius",
          op: "multiply",
          value: 1.5,
        },
        {
          file: "/pa/units/orbital/radar_satellite/radar_satellite.json",
          path: "recon.observer.items.4.radius",
          op: "multiply",
          value: 1.5,
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
