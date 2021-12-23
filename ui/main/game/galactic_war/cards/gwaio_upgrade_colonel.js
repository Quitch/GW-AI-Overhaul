define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioFunctions, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Colonel Upgrade Tech causes support commanders to explode on death."
    ),
    summarize: _.constant("!LOC:Colonel Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_bot_combat_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwaioFunctions.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        (gwaioFunctions.hasUnit(gwaioUnits.botFactoryAdvanced) ||
          inventory.hasCard("gwaio_upgrade_botfactory")) &&
        gwaioFunctions.hasUnit(gwaioUnits.colonel)
      ) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.colonel,
          path: "death_weapon.ground_ammo_spec",
          op: "replace",
          value: gwaioUnits.commanderDeath,
        },
        {
          file: gwaioUnits.colonel,
          path: "death_weapon.air_ammo_spec",
          op: "replace",
          value: gwaioUnits.commanderDeathAir,
        },
        {
          file: gwaioUnits.colonel,
          path: "death_weapon.air_height_threshold",
          op: "replace",
          value: 50,
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
