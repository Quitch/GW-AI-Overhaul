define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioFunctions, gwaioUnits) {
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
    getContext: gwaioFunctions.getContext,
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
          file: gwaioUnits.antAmmo,
          path: "splash_damage",
          op: "replace",
          value: 63,
        },
        {
          file: gwaioUnits.antAmmo,
          path: "splash_radius",
          op: "replace",
          value: 10,
        },
        {
          file: gwaioUnits.antAmmo,
          path: "full_damage_splash_radius",
          op: "replace",
          value: 2,
        },
        {
          file: gwaioUnits.antAmmo,
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
