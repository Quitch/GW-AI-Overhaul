define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Ragnarok Upgrade Tech allows the titan structure to annihilate all life on a planet while leaving the planet itself intact. It may take up to 30 seconds before you can land safely after detonation."
    ),
    summarize: _.constant("!LOC:Ragnarok Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_super_weapons_upgrade.png"
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
          "/pa/units/land/titan_structure/titan_structure.json"
        )
      ) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/land/titan_structure/titan_structure_pbaoe.json",
          path: "damage",
          op: "replace",
          value: 99999,
        },
        {
          file: "/pa/units/land/titan_structure/titan_structure_pbaoe.json",
          path: "full_damage_splash_radius",
          op: "replace",
          value: 99999,
        },
        {
          file: "/pa/units/land/titan_structure/titan_structure_pbaoe.json",
          path: "splash_damage",
          op: "replace",
          value: 99999,
        },
        {
          file: "/pa/units/land/titan_structure/titan_structure_pbaoe.json",
          path: "splash_damages_allies",
          op: "replace",
          value: true,
        },
        {
          file: "/pa/units/land/titan_structure/titan_structure_pbaoe.json",
          path: "splash_radius",
          op: "replace",
          value: 99999,
        },
        {
          file: "/pa/units/land/titan_structure/titan_structure_pbaoe.json",
          path: "damage_volume.burnable_remove_radius",
          op: "replace",
          value: 100,
        },
        {
          file: "/pa/units/land/titan_structure/titan_structure_pbaoe.json",
          path: "damage_volume.delay",
          op: "replace",
          value: 1.5,
        },
        {
          file: "/pa/units/land/titan_structure/titan_structure_pbaoe.json",
          path: "damage_volume.initial_radius",
          op: "replace",
          value: 20,
        },
        {
          file: "/pa/units/land/titan_structure/titan_structure_pbaoe.json",
          path: "damage_volume.radius_accel",
          op: "replace",
          value: -40,
        },
        {
          file: "/pa/units/land/titan_structure/titan_structure_pbaoe.json",
          path: "damage_volume.radius_velocity",
          op: "replace",
          value: 500,
        },
        {
          file: "/pa/units/land/titan_structure/titan_structure_pbaoe.json",
          path: "burn_damage",
          op: "replace",
          value: 200,
        },
        {
          file: "/pa/units/land/titan_structure/titan_structure_pbaoe.json",
          path: "burn_radius",
          op: "replace",
          value: 99999,
        },
        {
          file: "/pa/units/land/titan_structure/titan_structure_pbaoe.json",
          path: "planet_impact_spec.delay_time",
          op: "replace",
          value: 99999, // this is a hack and if I understood the eval op that might be better
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
