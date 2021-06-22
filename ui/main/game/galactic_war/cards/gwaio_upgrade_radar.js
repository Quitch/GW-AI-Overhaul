define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Radar Upgrade Tech increases the vision and radar radius of basic radar by 50%."
    ),
    summarize: _.constant("!LOC:Radar Upgrade Tech"),
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
    deal: function (system, context, inventory) {
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
          inventory.hasCard("gwc_start_artillery"))
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/land/radar/radar.json",
          path: "recon.observer.items.0.radius",
          op: "multiply",
          value: 1.5,
        },
        {
          file: "/pa/units/land/radar/radar.json",
          path: "recon.observer.items.1.radius",
          op: "multiply",
          value: 1.5,
        },
        {
          file: "/pa/units/land/radar/radar.json",
          path: "recon.observer.items.2.radius",
          op: "multiply",
          value: 1.5,
        },
        {
          file: "/pa/units/land/radar/radar.json",
          path: "recon.observer.items.3.radius",
          op: "multiply",
          value: 1.5,
        },
        {
          file: "/pa/units/land/radar/radar.json",
          path: "recon.observer.items.4.radius",
          op: "multiply",
          value: 1.5,
        },
      ]);
    },
    dull: function () {},
  };
});
