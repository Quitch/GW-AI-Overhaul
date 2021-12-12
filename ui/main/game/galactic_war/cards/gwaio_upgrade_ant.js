define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Ant Upgrade Tech adds splash damage to the light tank's attack."
    ),
    summarize: _.constant("!LOC:Ant Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_vehicle_upgrade.png"
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
          "/pa/units/land/tank_light_laser/tank_light_laser.json"
        )
      ) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/land/tank_light_laser/tank_light_laser_ammo.json",
          path: "splash_damage",
          op: "replace",
          value: 63,
        },
        {
          file: "/pa/units/land/tank_light_laser/tank_light_laser_ammo.json",
          path: "splash_radius",
          op: "replace",
          value: 10,
        },
        {
          file: "/pa/units/land/tank_light_laser/tank_light_laser_ammo.json",
          path: "full_damage_splash_radius",
          op: "replace",
          value: 2,
        },
        {
          file: "/pa/units/land/tank_light_laser/tank_light_laser_ammo.json",
          path: "events",
          op: "replace",
          value: {
            died: {
              audio_cue: "/SE/Impacts/bot_spark_impact",
              effect_spec: "/pa/effects/specs/tesla_hit.pfx",
            },
          },
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
