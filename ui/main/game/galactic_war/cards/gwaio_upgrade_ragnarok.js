define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioCards, gwaioUnits) {
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
    getContext: gwaioCards.getContext,
    deal: function () {
      var chance = 0;
      if (gwaioCards.hasUnit(gwaioUnits.ragnarok)) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.ragnarokPbaoe,
          path: "damage",
          op: "replace",
          value: 99999,
        },
        {
          file: gwaioUnits.ragnarokPbaoe,
          path: "full_damage_splash_radius",
          op: "replace",
          value: 99999,
        },
        {
          file: gwaioUnits.ragnarokPbaoe,
          path: "splash_damage",
          op: "replace",
          value: 99999,
        },
        {
          file: gwaioUnits.ragnarokPbaoe,
          path: "splash_damages_allies",
          op: "replace",
          value: true,
        },
        {
          file: gwaioUnits.ragnarokPbaoe,
          path: "splash_radius",
          op: "replace",
          value: 99999,
        },
        {
          file: gwaioUnits.ragnarokPbaoe,
          path: "damage_volume.burnable_remove_radius",
          op: "replace",
          value: 100,
        },
        {
          file: gwaioUnits.ragnarokPbaoe,
          path: "damage_volume.delay",
          op: "replace",
          value: 1.5,
        },
        {
          file: gwaioUnits.ragnarokPbaoe,
          path: "damage_volume.initial_radius",
          op: "replace",
          value: 20,
        },
        {
          file: gwaioUnits.ragnarokPbaoe,
          path: "damage_volume.radius_accel",
          op: "replace",
          value: -40,
        },
        {
          file: gwaioUnits.ragnarokPbaoe,
          path: "damage_volume.radius_velocity",
          op: "replace",
          value: 500,
        },
        {
          file: gwaioUnits.ragnarokPbaoe,
          path: "burn_damage",
          op: "replace",
          value: 200,
        },
        {
          file: gwaioUnits.ragnarokPbaoe,
          path: "burn_radius",
          op: "replace",
          value: 99999,
        },
        {
          file: gwaioUnits.ragnarokPbaoe,
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
