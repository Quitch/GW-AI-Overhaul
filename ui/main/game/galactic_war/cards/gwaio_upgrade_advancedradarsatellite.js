define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Advanced Radar Satellite Upgrade Tech increases the vision and radar of the advanced orbital radar by 50%."
    ),
    summarize: _.constant("!LOC:Advanced Radar Satellite Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_intelligence_fabrication_upgrade.png"
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
          "/pa/units/orbital/orbital_factory/orbital_factory.json"
        ) &&
        gwaioFunctions.hasUnit(
          "/pa/units/orbital/radar_satellite_adv/radar_satellite_adv.json"
        )
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/orbital/radar_satellite_adv/radar_satellite_adv.json",
          path: "recon.observer.items.0.radius",
          op: "multiply",
          value: 1.5,
        },
        {
          file: "/pa/units/orbital/radar_satellite_adv/radar_satellite_adv.json",
          path: "recon.observer.items.1.radius",
          op: "multiply",
          value: 1.5,
        },
        {
          file: "/pa/units/orbital/radar_satellite_adv/radar_satellite_adv.json",
          path: "recon.observer.items.2.radius",
          op: "multiply",
          value: 1.5,
        },
        {
          file: "/pa/units/orbital/radar_satellite_adv/radar_satellite_adv.json",
          path: "recon.observer.items.3.radius",
          op: "multiply",
          value: 1.5,
        },
        {
          file: "/pa/units/orbital/radar_satellite_adv/radar_satellite_adv.json",
          path: "recon.observer.items.4.radius",
          op: "multiply",
          value: 1.5,
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
