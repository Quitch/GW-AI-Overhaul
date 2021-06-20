define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Enables the building of the Planetary Radar which provides complete planetary radar coverage."
    ),
    summarize: _.constant("!LOC:Planetary Radar Tech"),
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
        gwaioFunctions.hasUnit(
          "/pa/units/air/air_factory_adv/air_factory_adv.json"
        ) ||
        inventory.hasCard("gwaio_upgrade_airfactory") ||
        gwaioFunctions.hasUnit(
          "/pa/units/land/bot_factory_adv/bot_factory_adv.json"
        ) ||
        inventory.hasCard("gwaio_upgrade_botfactory") ||
        gwaioFunctions.hasUnit(
          "/pa/units/sea/naval_factory_adv/naval_factory_adv.json"
        ) ||
        inventory.hasCard("gwaio_upgrade_navalfactory") ||
        gwaioFunctions.hasUnit(
          "/pa/units/land/vehicle_factory_adv/vehicle_factory_adv.json"
        ) ||
        inventory.hasCard("gwaio_upgrade_vehiclefactory")
      )
        chance = 100;

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/orbital/deep_space_radar/deep_space_radar.json",
          path: "unit_name",
          op: "replace",
          value: "Planetary Radar",
        },
        {
          file: "/pa/units/orbital/deep_space_radar/deep_space_radar.json",
          path: "display_name",
          op: "replace",
          value: "!LOC:Planetary Radar",
        },
        {
          file: "/pa/units/orbital/deep_space_radar/deep_space_radar.json",
          path: "description",
          op: "replace",
          value:
            "!LOC:Planetary Radar - Detects enemy land, sea, and air units across the planet.",
        },
        {
          file: "/pa/units/orbital/deep_space_radar/deep_space_radar.json",
          path: "unit_types",
          op: "replace",
          value: [
            "UNITTYPE_Land",
            "UNITTYPE_Structure",
            "UNITTYPE_Advanced",
            "UNITTYPE_Recon",
            "UNITTYPE_FabAdvBuild",
            "UNITTYPE_Radar",
            "UNITTYPE_Important",
          ],
        },
        {
          file: "/pa/units/orbital/deep_space_radar/deep_space_radar.json",
          path: "max_health",
          op: "multiply",
          value: 3,
        },
        {
          file: "/pa/units/orbital/deep_space_radar/deep_space_radar.json",
          path: "build_metal_cost",
          op: "multiply",
          value: 8,
        },
        {
          file: "/pa/units/orbital/deep_space_radar/deep_space_radar.json",
          path: "consumption.energy",
          op: "multiply",
          value: 50,
        },
        {
          file: "/pa/units/orbital/deep_space_radar/deep_space_radar.json",
          path: "recon.observer.items",
          op: "replace",
          value: [
            {
              layer: "surface_and_air",
              channel: "sight",
              shape: "capsule",
              radius: 300,
              uses_energy: true,
            },
            {
              layer: "surface_and_air",
              channel: "radar",
              shape: "capsule",
              radius: 9999,
              uses_energy: true,
            },
            {
              layer: "orbital",
              channel: "sight",
              shape: "capsule",
              radius: 1200,
              uses_energy: true,
            },
            {
              layer: "underwater",
              channel: "sight",
              shape: "capsule",
              radius: 9999,
              uses_energy: true,
            },
            {
              layer: "underwater",
              channel: "radar",
              shape: "capsule",
              radius: 9999,
              uses_energy: true,
            },
          ],
        },
        {
          file: "/pa/units/orbital/deep_space_radar/deep_space_radar.json",
          path: "selection_icon.diameter",
          op: "replace",
          value: 55,
        },
      ]);
      inventory.addAIMods([
        {
          type: "fabber",
          op: "load",
          value: "gwaio_enable_planetaryradar.json",
        },
      ]);
    },
    dull: function () {},
  };
});
